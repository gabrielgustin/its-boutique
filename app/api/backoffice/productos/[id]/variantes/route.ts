import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBackofficeSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const variants = await sql`
    SELECT id, nombre, precio
    FROM producto_variantes
    WHERE producto_id = ${id}
    ORDER BY orden ASC
  `
  return NextResponse.json(variants)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBackofficeSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const variantes = Array.isArray(body.variantes) ? body.variantes : []

  await sql`DELETE FROM producto_variantes WHERE producto_id = ${id}`
  for (const variante of variantes) {
    const nombre = String(variante?.nombre || "").trim()
    const precio = Number(variante?.precio)
    if (!nombre || !Number.isFinite(precio) || precio < 0) continue
    await sql`
      INSERT INTO producto_variantes (producto_id, nombre, precio)
      VALUES (${id}, ${nombre}, ${precio})
    `
  }

  const result = await sql`
    SELECT id, nombre, precio FROM producto_variantes
    WHERE producto_id = ${id} ORDER BY orden ASC
  `
  return NextResponse.json(result)
}
