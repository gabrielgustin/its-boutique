import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, imagen, visible } = body
    const { id } = await params

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
    }

    const result = await sql`
      UPDATE categorias 
      SET nombre = ${nombre}, 
          imagen = ${imagen},
          visible = ${visible !== undefined ? visible : true},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
    }

    const mapped = {
      id: result[0].id,
      nombre: result[0].nombre,
      imagen: result[0].imagen,
      visible: result[0].visible,
    }

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error updating categoria:", error)
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const result = await sql`
      DELETE FROM categorias 
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ message: "Categoría eliminada correctamente" })
  } catch (error) {
    console.error("Error deleting categoria:", error)
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 })
  }
}
