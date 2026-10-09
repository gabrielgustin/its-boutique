import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"
import { cleanDiscount } from "@/lib/pricing"

export async function GET() {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const products = await sql`
      SELECT * FROM productos 
      ORDER BY categoria ASC, orden ASC NULLS LAST, created_at ASC
    `

    const mapped = products.map((prod: any) => ({
      id: prod.id,
      nombre: prod.nombre,
      descripcion: prod.descripcion || "",
      precio: prod.precio?.toString() || "0",
      imagen: prod.imagen,
      categoria: prod.categoria,
      visible: prod.visible !== false,
      subcategoria: prod.subcategoria || "",
      descuento: prod.descuento || 0,
      orden: prod.orden,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error fetching productos - Full error:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, descripcion, precio, imagen, categoria, subcategoria, descuento, variantes = [] } = body

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
    }

    const id = crypto.randomUUID()

    const result = await sql`
      INSERT INTO productos (id, nombre, descripcion, precio, imagen, categoria, visible, subcategoria, descuento)
      VALUES (
        ${id},
        ${nombre}, 
        ${descripcion || ""}, 
        ${Number.parseInt(precio) || 0}, 
        ${imagen || "/placeholder.svg?height=200&width=200"},
        ${categoria || ""},
        ${true},
        ${subcategoria || ""},
        ${cleanDiscount(descuento)}
      )
      RETURNING *
    `

    for (const variante of Array.isArray(variantes) ? variantes : []) {
      if (!variante?.nombre || !Number.isFinite(Number(variante.precio)) || Number(variante.precio) < 0) continue
      await sql`
        INSERT INTO producto_variantes (producto_id, nombre, precio)
        VALUES (${id}, ${variante.nombre.trim()}, ${Math.round(Number(variante.precio))})
      `
    }

    const mapped = {
      id: result[0].id,
      nombre: result[0].nombre,
      descripcion: result[0].descripcion || "",
      precio: result[0].precio?.toString() || "0",
      imagen: result[0].imagen,
      categoria: result[0].categoria,
      visible: result[0].visible,
      subcategoria: result[0].subcategoria || "",
      descuento: result[0].descuento || 0,
    }

    return NextResponse.json(mapped, { status: 201 })
  } catch (error) {
    console.error("Error creating producto:", error)
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}
