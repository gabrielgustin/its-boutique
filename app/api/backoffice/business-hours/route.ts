import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function GET() {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }


    const hours = await sql`
      SELECT 
        id, day_of_week, is_open, 
        open_time, close_time,
        additional_open_time, additional_close_time,
        created_at, updated_at
      FROM business_hours 
      ORDER BY 
        CASE LOWER(day_of_week)
          WHEN 'monday' THEN 1
          WHEN 'lunes' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'martes' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'miercoles' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'jueves' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'viernes' THEN 5
          WHEN 'saturday' THEN 6
          WHEN 'sabado' THEN 6
          WHEN 'sunday' THEN 7
          WHEN 'domingo' THEN 7
        END
    `

    // Also fetch the config
    const config = await sql`
      SELECT allow_orders_when_closed, id, created_at, updated_at
      FROM business_hours_config
      LIMIT 1
    `


    return NextResponse.json({
      success: true,
      data: {
        hours: hours,
        config: config[0] || { allow_orders_when_closed: false },
      },
    })
  } catch (error) {
    console.error("Error fetching business hours:", error)
    return NextResponse.json({ error: "Error al obtener horarios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    const { hours, allow_orders_when_closed } = body

    await sql`DELETE FROM business_hours`

    for (const day of hours) {
      await sql`
        INSERT INTO business_hours (
          day_of_week, is_open, open_time, close_time,
          additional_open_time, additional_close_time
        )
        VALUES (
          ${day.day_of_week}, 
          ${day.is_open}, 
          ${day.open_time}, 
          ${day.close_time},
          ${day.additional_open_time || null}, 
          ${day.additional_close_time || null}
        )
      `

    }


    const existingConfig = await sql`
      SELECT id FROM business_hours_config LIMIT 1
    `

    if (existingConfig.length > 0) {
      await sql`
        UPDATE business_hours_config 
        SET 
          allow_orders_when_closed = ${allow_orders_when_closed},
          updated_at = NOW()
        WHERE id = ${existingConfig[0].id}
      `
    } else {
      await sql`
        INSERT INTO business_hours_config (allow_orders_when_closed)
        VALUES (${allow_orders_when_closed})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving business hours:", error)
    return NextResponse.json({ error: "Error al guardar horarios" }, { status: 500 })
  }
}
