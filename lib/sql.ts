import "server-only"
import { promises as fs } from "node:fs"
import path from "node:path"
import type { Pool, PoolClient } from "pg"

// Única puerta de entrada a la base de datos.
//
// - Con DATABASE_URL: Postgres real (Neon, Supabase, RDS…) a través de `pg`.
// - Sin DATABASE_URL: PGlite, un Postgres embebido que guarda en ./data/pglite.
//   Es el mismo motor y el mismo SQL, así que lo que funciona en local funciona
//   en producción. Las migraciones de db/migrations se aplican solas al arrancar.

export type Row = Record<string, any>

export interface Queryable {
  /** Consulta con parámetros posicionales ($1, $2…). */
  query<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]>
}

type SqlTag = <T extends Row = Row>(strings: TemplateStringsArray, ...values: unknown[]) => Promise<T[]>

export const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.NEON_POSTGRES_URL ||
  ""

export const isLocalDatabase = !DATABASE_URL

const DATA_DIR = path.join(process.cwd(), "data")
const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations")

interface Driver extends Queryable {
  transaction<T>(run: (tx: Queryable) => Promise<T>): Promise<T>
  /** Objeto con la forma de un Pool de `pg`, para Better Auth (Kysely). */
  pool: Pool
}

// En desarrollo Next recarga los módulos: la conexión vive en globalThis para no abrir una por recarga.
const globalStore = globalThis as unknown as { __itsDriver?: Promise<Driver> }

async function createPgDriver(): Promise<Driver> {
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: DATABASE_URL, max: 5 })
  const run = async <T extends Row>(client: Pool | PoolClient, text: string, params: unknown[] = []) =>
    (await client.query(text, params)).rows as T[]

  return {
    pool,
    query: (text, params) => run(pool, text, params),
    async transaction(fn) {
      const client = await pool.connect()
      try {
        await client.query("BEGIN")
        const result = await fn({ query: (text, params) => run(client, text, params) })
        await client.query("COMMIT")
        return result
      } catch (error) {
        await client.query("ROLLBACK")
        throw error
      } finally {
        client.release()
      }
    },
  }
}

async function createPgliteDriver(): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite")
  await fs.mkdir(DATA_DIR, { recursive: true })
  const db = new PGlite(path.join(DATA_DIR, "pglite"))
  await db.waitReady

  const toResult = (result: { rows: unknown[]; affectedRows?: number }) => ({
    rows: result.rows,
    rowCount: result.affectedRows ?? result.rows.length,
    command: "",
  })
  // Lo mínimo que Kysely (Better Auth) usa de un Pool de `pg`.
  const client = {
    query: async (text: string, params?: unknown[]) => toResult(await db.query(text, params as any[])),
    release() {},
  }
  const pool = { connect: async () => client, end: async () => {} } as unknown as Pool

  const driver: Driver = {
    pool,
    query: async (text, params) => (await db.query(text, params as any[])).rows as any[],
    transaction: (fn) =>
      db.transaction((tx) => fn({ query: async (text, params) => (await tx.query(text, params as any[])).rows as any[] })) as Promise<any>,
  }

  const exec = (text: string) => db.exec(text).then(() => undefined)
  await migrate(driver, exec)
  await seedDemo(driver, exec)
  return driver
}

/** Aplica las migraciones pendientes de db/migrations, en orden y una sola vez cada una. */
export async function migrate(driver: Queryable, exec: (text: string) => Promise<void>) {
  await exec(`CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
  const applied = new Set((await driver.query<{ name: string }>(`SELECT name FROM _migrations`)).map((row) => row.name))
  const files = (await fs.readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith(".sql")).sort()
  const done: string[] = []
  for (const file of files) {
    if (applied.has(file)) continue
    const text = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf8")
    await exec(`BEGIN;\n${text}\n;INSERT INTO _migrations (name) VALUES ('${file.replace(/'/g, "''")}');\nCOMMIT;`)
    done.push(file)
  }
  return done
}

/** Solo en local: carga un cupón y datos de contacto de ejemplo la primera vez. */
async function seedDemo(driver: Queryable, exec: (text: string) => Promise<void>) {
  const [{ count }] = await driver.query<{ count: string }>(`SELECT COUNT(*) AS count FROM coupons`)
  if (Number(count) > 0) return
  const file = path.join(process.cwd(), "db", "seed", "demo.sql")
  const text = await fs.readFile(file, "utf8").catch(() => null)
  if (text) await exec(text)
}

function getDriver(): Promise<Driver> {
  // En producción nunca se usa la base local: falla con un mensaje claro en vez de perder datos.
  if (process.env.VERCEL && isLocalDatabase) {
    return Promise.reject(new Error("Falta DATABASE_URL: conectá la base de datos (Neon) en las variables de entorno del proyecto."))
  }
  globalStore.__itsDriver ??= (isLocalDatabase ? createPgliteDriver() : createPgDriver()).catch((error) => {
    globalStore.__itsDriver = undefined
    throw error
  })
  return globalStore.__itsDriver
}

const compile = (strings: TemplateStringsArray) => strings.reduce((text, part, index) => `${text}$${index}${part}`)

// La tienda guarda en caché el catálogo y la configuración (lib/db.ts). Cualquier
// escritura la invalida, así el backoffice nunca tiene que acordarse de hacerlo.
const WRITE = /^\s*(INSERT|UPDATE|DELETE)\b/i
async function afterWrite() {
  try {
    const { revalidateTag } = await import("next/cache")
    revalidateTag("catalog", { expire: 0 })
    revalidateTag("config", { expire: 0 })
  } catch {
    // Fuera de una ruta o acción del servidor no hay caché que invalidar.
  }
}

async function run<T extends Row>(target: Queryable, text: string, params?: unknown[]): Promise<T[]> {
  const rows = await target.query<T>(text, params)
  if (WRITE.test(text)) await afterWrite()
  return rows
}

/** Consulta con plantilla: los valores viajan siempre como parámetros, nunca dentro del texto SQL. */
export const sql: SqlTag = async (strings, ...values) => run(await getDriver(), compile(strings), values)

export const query: Queryable["query"] = async (text, params) => run(await getDriver(), text, params)

/** Varias consultas que se confirman juntas o no se confirma ninguna. */
export async function transaction<T>(fn: (tx: Queryable & { sql: SqlTag }) => Promise<T>): Promise<T> {
  const result = await (await getDriver()).transaction((tx) => fn({ ...tx, sql: (strings, ...values) => tx.query(compile(strings), values) }))
  await afterWrite()
  return result
}

export async function getPool(): Promise<Pool> {
  return (await getDriver()).pool
}
