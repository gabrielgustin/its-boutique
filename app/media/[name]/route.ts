import { promises as fs } from "node:fs"
import path from "node:path"

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads")
const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" }

// Sirve las imágenes subidas desde el backoffice (data/uploads). Los nombres son
// aleatorios y nunca se reescriben, por eso la caché puede ser inmutable.
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const type = TYPES[path.extname(name).toLowerCase()]
  if (!type || !/^[\w-]+\.\w+$/.test(name)) return new Response("Not found", { status: 404 })

  try {
    const file = await fs.readFile(path.join(UPLOADS_DIR, name))
    return new Response(file, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" } })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
