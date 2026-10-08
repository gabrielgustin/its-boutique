import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function GET() {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const categories = await sql`
      SELECT * FROM categorias 
      ORDER BY orden ASC NULLS LAST, created_at ASC
    `

    const mapped = categories.map((cat: any) => ({
      id: cat.id,
      nombre: cat.nombre,
      imagen: cat.imagen,
      visible: cat.visible !== false,
      orden: cat.orden,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error fetching categorias:", error)
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, imagen } = body

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
    }

    const baseId = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens

    // Check if ID already exists and append a number if needed
    let id = baseId
    let counter = 1
    let exists = true

    while (exists) {
      const check = await sql`SELECT id FROM categorias WHERE id = ${id}`
      if (check.length === 0) {
        exists = false
      } else {
        id = `${baseId}-${counter}`
        counter++
      }
    }

    const result = await sql`
      INSERT INTO categorias (id, nombre, imagen, visible)
      VALUES (
        ${id},
        ${nombre}, 
        ${imagen || "/placeholder.svg?height=400&width=400"},
        ${true}
      )
      RETURNING *
    `

    const mapped = {
      id: result[0].id,
      nombre: result[0].nombre,
      imagen: result[0].imagen,
      visible: result[0].visible,
    }

    return NextResponse.json(mapped, { status: 201 })
  } catch (error) {
    console.error("Error creating categoria - Full error:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    return NextResponse.json(
      {
        error: "Error al crear categoría",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
