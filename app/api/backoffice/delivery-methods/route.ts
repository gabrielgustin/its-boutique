import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function GET() {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }


    const methods = await sql`
      SELECT * FROM delivery_methods 
      ORDER BY is_required DESC, id
    `


    return NextResponse.json({ success: true, data: methods })
  } catch (error) {
    console.error("Error fetching delivery methods:", error)
    return NextResponse.json({ error: "Error al obtener formas de entrega" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    const { name, is_active } = body
    const cost = Math.max(0, Math.round(Number(body.delivery_cost) || 0))

    const result = await sql`
      INSERT INTO delivery_methods (name, is_active, delivery_cost)
      VALUES (${name}, ${is_active !== undefined ? is_active : true}, ${cost})
      RETURNING *
    `


    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error("Error creating delivery method:", error)
    return NextResponse.json({ error: "Error al crear forma de entrega" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    const { id, name, is_active } = body
    // El costo es opcional: si no viene, se conserva el que ya tenía.
    const cost = body.delivery_cost === undefined ? null : Math.max(0, Math.round(Number(body.delivery_cost) || 0))

    const existingMethod = await sql`
      SELECT is_required FROM delivery_methods WHERE id = ${id}
    `

    if (existingMethod[0]?.is_required) {
      // Only allow changing is_active for required methods
      await sql`
        UPDATE delivery_methods 
        SET is_active = ${is_active},
            delivery_cost = COALESCE(${cost}::numeric, delivery_cost)
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE delivery_methods 
        SET name = ${name}, 
            is_active = ${is_active},
            delivery_cost = COALESCE(${cost}::numeric, delivery_cost)
        WHERE id = ${id}
      `
    }


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating delivery method:", error)
    return NextResponse.json({ error: "Error al actualizar forma de entrega" }, { status: 500 })
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
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }


    const method = await sql`
      SELECT is_required FROM delivery_methods WHERE id = ${id}
    `

    if (method[0]?.is_required) {
      return NextResponse.json({ error: "No se puede eliminar una forma de entrega obligatoria" }, { status: 400 })
    }

    await sql`
      DELETE FROM delivery_methods 
      WHERE id = ${id}
    `


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting delivery method:", error)
    return NextResponse.json({ error: "Error al eliminar forma de entrega" }, { status: 500 })
  }
}
