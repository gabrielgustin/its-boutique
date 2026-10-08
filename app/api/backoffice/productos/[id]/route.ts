import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, descripcion, precio, imagen, categoria, visible, subcategoria, descuento } = body
    const { id } = await params


    if (!nombre || nombre.trim() === "") {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
    }

    const result = await sql`
      UPDATE productos 
      SET nombre = ${nombre}, 
          descripcion = ${descripcion || ""}, 
          precio = ${precio || "0"},
          imagen = ${imagen || "/placeholder.svg?height=200&width=200"},
          categoria = ${categoria || ""},
          visible = ${visible !== false},
          subcategoria = ${subcategoria || ""},
          descuento = ${descuento || 0},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }


    const mapped = {
      id: result[0].id,
      nombre: result[0].nombre,
      descripcion: result[0].descripcion || "",
      precio: result[0].precio?.toString() || "0",
      imagen: result[0].imagen,
      categoria: result[0].categoria,
      visible: result[0].visible !== false,
      subcategoria: result[0].subcategoria || "",
      descuento: result[0].descuento || 0,
    }

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error updating producto:", error)
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params


    const result = await sql`
      DELETE FROM productos 
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }


    return NextResponse.json({ message: "Producto eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting producto:", error)
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 })
  }
}
