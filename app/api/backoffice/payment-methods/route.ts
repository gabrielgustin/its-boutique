import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function GET() {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }


    const methods = await sql`
      SELECT * FROM payment_methods 
      ORDER BY id
    `


    return NextResponse.json({ success: true, data: methods })
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ error: "Error al obtener métodos de pago" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    const { name, is_active } = body

    const result = await sql`
      INSERT INTO payment_methods (name, is_active)
      VALUES (${name}, ${is_active !== undefined ? is_active : true})
      RETURNING *
    `


    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error("Error creating payment method:", error)
    return NextResponse.json({ error: "Error al crear método de pago" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    const { id, name, is_active } = body

    await sql`
      UPDATE payment_methods 
      SET name = ${name}, 
          is_active = ${is_active}
      WHERE id = ${id}
    `


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating payment method:", error)
    return NextResponse.json({ error: "Error al actualizar método de pago" }, { status: 500 })
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


    await sql`
      DELETE FROM payment_methods 
      WHERE id = ${id}
    `


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting payment method:", error)
    return NextResponse.json({ error: "Error al eliminar método de pago" }, { status: 500 })
  }
}
