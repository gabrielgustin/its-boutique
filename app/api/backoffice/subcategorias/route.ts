import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function GET(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoriaId = searchParams.get("categoria_id")

    const subcategorias = categoriaId
      ? await sql`
          SELECT s.*, c.nombre as categoria_nombre 
          FROM subcategorias s
          LEFT JOIN categorias c ON s.categoria_id = c.id
          WHERE s.categoria_id = ${categoriaId}
          ORDER BY s.categoria_id ASC, s.orden ASC NULLS LAST, s.nombre ASC
        `
      : await sql`
          SELECT s.*, c.nombre as categoria_nombre 
          FROM subcategorias s
          LEFT JOIN categorias c ON s.categoria_id = c.id
          ORDER BY s.categoria_id ASC, s.orden ASC NULLS LAST, s.nombre ASC
        `

    return NextResponse.json(subcategorias)
  } catch (error) {
    console.error("Error fetching subcategorias:", error)
    return NextResponse.json({ error: "Error al obtener subcategorías" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { nombre, categoria_id } = await request.json()

    if (!nombre || !categoria_id) {
      return NextResponse.json({ error: "Nombre y categoría son obligatorios" }, { status: 400 })
    }

    const baseId = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    let id = `${baseId}-${categoria_id}`
    let counter = 1

    // Check if ID already exists and add counter if needed
    while (true) {
      const existing = await sql`SELECT id FROM subcategorias WHERE id = ${id}`
      if (existing.length === 0) break
      id = `${baseId}-${categoria_id}-${counter}`
      counter++
    }

    // La subcategoría nueva queda al final de su categoría.
    const result = await sql`
      INSERT INTO subcategorias (id, nombre, categoria_id, orden, created_at, updated_at)
      VALUES (
        ${id}, ${nombre}, ${categoria_id},
        (SELECT COALESCE(MAX(orden) + 1, 0) FROM subcategorias WHERE categoria_id = ${categoria_id}),
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating subcategoria:", error)
    return NextResponse.json({ error: "Error al crear subcategoría" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const { nombre } = await request.json()

    if (!id || !nombre) {
      return NextResponse.json({ error: "ID y nombre son obligatorios" }, { status: 400 })
    }

    const result = await sql`
      UPDATE subcategorias 
      SET nombre = ${nombre}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Subcategoría no encontrada" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating subcategoria:", error)
    return NextResponse.json({ error: "Error al actualizar subcategoría" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID es obligatorio" }, { status: 400 })
    }

    await sql`DELETE FROM subcategorias WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting subcategoria:", error)
    return NextResponse.json({ error: "Error al eliminar subcategoría" }, { status: 500 })
  }
}
