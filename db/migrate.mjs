// Aplica las migraciones de db/migrations a la base de DATABASE_URL.
// Se ejecuta antes de cada build (`npm run build`) y a mano con `npm run db:migrate`.
// Sin DATABASE_URL no hace nada: en local las aplica la app sola sobre PGlite.
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || process.env.NEON_POSTGRES_URL
if (!url && process.env.VERCEL) {
  console.error("[migrate] Falta DATABASE_URL en Vercel: conectá Neon (Storage) al proyecto antes de desplegar.")
  process.exit(1)
}
if (!url) {
  console.log("[migrate] Sin DATABASE_URL: no hay nada que migrar (modo local con PGlite).")
  process.exit(0)
}

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations")
const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  // Un candado evita que dos despliegues simultáneos migren a la vez.
  await client.query("SELECT pg_advisory_lock(727001)")
  await client.query("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())")
  const applied = new Set((await client.query("SELECT name FROM _migrations")).rows.map((row) => row.name))
  const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort()
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
