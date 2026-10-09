// Aplica las migraciones de db/migrations a la base de DATABASE_URL.
// Se ejecuta antes de cada build (`npm run build`) y a mano con `npm run db:migrate`.
// Sin DATABASE_URL no hace nada: en local las aplica la app sola sobre PGlite.
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

// Se prefiere la conexión directa (sin pooler): el candado de abajo es de sesión y con el
// pooler de Neon (modo transacción) puede quedar tomado en una conexión compartida.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || process.env.NEON_POSTGRES_URL
if (!url && process.env.VERCEL) {
  console.error("[migrate] Falta DATABASE_URL en Vercel: conectá Neon (Storage) al proyecto antes de desplegar.")
  process.exit(1)
}
if (!url) {
  console.log("[migrate] Sin DATABASE_URL: no hay nada que migrar (modo local con PGlite).")
  process.exit(0)
}

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations")
const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 30_000 })
await client.connect()
try {
  await client.query("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())")
  const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort()
  const isPending = async () => {
    const applied = new Set((await client.query("SELECT name FROM _migrations")).rows.map((row) => row.name))
    return files.filter((file) => !applied.has(file))
  }

  // Lo normal es que no haya nada pendiente: se sale sin pedir el candado, así que dos
  // despliegues simultáneos no se esperan entre sí.
  if ((await isPending()).length === 0) {
    console.log("[migrate] Base de datos al día.")
    process.exit(0)
  }

  // Un candado evita que dos despliegues simultáneos migren a la vez. Si no se consigue en
  // 2 minutos el build falla con un mensaje claro en vez de quedarse esperando para siempre.
  const deadline = Date.now() + 120_000
  while (!(await client.query("SELECT pg_try_advisory_lock(727001) AS ok")).rows[0].ok) {
    if (Date.now() > deadline) throw new Error("[migrate] No se pudo tomar el candado de migraciones en 2 minutos: hay otro despliegue migrando o una conexión colgada.")
    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }
  const applied = new Set((await client.query("SELECT name FROM _migrations")).rows.map((row) => row.name))
  for (const file of files) {
    if (applied.has(file)) continue
    const text = await readFile(path.join(dir, file), "utf8")
    await client.query("BEGIN")
    try {
      await client.query(text)
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file])
      await client.query("COMMIT")
      console.log(`[migrate] aplicada ${file}`)
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    }
  }
  console.log("[migrate] Base de datos al día.")
} finally {
  await client.end()
}
