import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function GET() {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }


    const coupons = await sql`
      SELECT * FROM coupons 
      ORDER BY created_at DESC
    `


    return NextResponse.json({ success: true, data: coupons })
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json({ error: "Error al obtener cupones" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    const { code, discount_type, discount_value, start_date, end_date, is_active } = body

    // Verificar que el código sea único
    const existing = await sql`
      SELECT id FROM coupons WHERE code = ${code}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Ya existe un cupón con ese código" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO coupons (code, discount_type, discount_value, start_date, end_date, is_active)
      VALUES (${code}, ${discount_type}, ${discount_value}, ${start_date || null}, ${end_date || null}, ${is_active !== false})
      RETURNING *
    `


    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "Error al crear cupón" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    const { id, code, discount_type, discount_value, start_date, end_date, is_active } = body

    // Verificar que el código sea único (excepto para el cupón actual)
    const existing = await sql`
      SELECT id FROM coupons WHERE code = ${code} AND id != ${id}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Ya existe un cupón con ese código" }, { status: 400 })
    }

    await sql`
      UPDATE coupons 
      SET code = ${code}, 
          discount_type = ${discount_type}, 
          discount_value = ${discount_value}, 
          start_date = ${start_date || null}, 
          end_date = ${end_date || null}, 
          is_active = ${is_active !== false}
      WHERE id = ${id}
    `


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json({ error: "Error al actualizar cupón" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }


    await sql`
      DELETE FROM coupons 
      WHERE id = ${id}
    `


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json({ error: "Error al eliminar cupón" }, { status: 500 })
  }
}
