import { NextResponse } from "next/server"
import { requireBackofficeSession } from "@/lib/backoffice-auth"
import { sql, transaction } from "@/lib/sql"

// Fotos extra de un producto (la principal se edita junto con el producto).

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBackofficeSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const rows = await sql`SELECT url FROM producto_imagenes WHERE producto_id = ${id} ORDER BY orden ASC, created_at ASC`
  return NextResponse.json(rows.map((row) => row.url))
}

const VALID_URL = /^(\/media\/[\w.-]+|\/demo\/[\w.-]+|https:\/\/\S+)$/

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBackofficeSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const body = (await request.json().catch(() => null)) as { urls?: unknown } | null
  const urls = Array.isArray(body?.urls) ? body.urls.filter((url): url is string => typeof url === "string" && VALID_URL.test(url)).slice(0, 8) : null
  if (!urls) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  try {
    await transaction(async (tx) => {
      await tx.sql`DELETE FROM producto_imagenes WHERE producto_id = ${id}`
      for (const [orden, url] of urls.entries()) {
        await tx.sql`INSERT INTO producto_imagenes (producto_id, url, orden) VALUES (${id}, ${url}, ${orden})`
      }
    })
    return NextResponse.json(urls)
  } catch (error) {
    console.error("[productos] Error guardando las fotos:", error)
    return NextResponse.json({ error: "No se pudieron guardar las fotos" }, { status: 500 })
  }
}
