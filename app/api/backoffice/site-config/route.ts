import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function GET() {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }


    const result = await sql`
      SELECT config_key, config_value, description
      FROM site_config
    `


    // Convert array of key-value pairs to object
    const config: Record<string, string> = {}
    result.forEach((row: any) => {
      config[row.config_key] = row.config_value
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching site config:", error)
    return NextResponse.json({ error: "Failed to fetch site config" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { key, value, description } = body


    // Check if key exists
    const existing = await sql`
      SELECT id FROM site_config WHERE config_key = ${key}
    `

    if (existing.length > 0) {
      // Update existing
      await sql`
        UPDATE site_config
        SET config_value = ${value}, updated_at = NOW()
        WHERE config_key = ${key}
      `
    } else {
      // Insert new
      await sql`
        INSERT INTO site_config (config_key, config_value, description, updated_at)
        VALUES (${key}, ${value}, ${description || ""}, NOW())
      `
    }


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating site config:", error)
    return NextResponse.json({ error: "Failed to update site config" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    for (const [key, value] of Object.entries(body)) {
      try {

        const stringValue = typeof value === "string" ? value : String(value)
        const description = `Configuración de ${key}`

        // Check if key exists
        const existing = await sql`
          SELECT id FROM site_config WHERE config_key = ${key}
        `

        if (existing.length > 0) {
          // Update existing
          await sql`
            UPDATE site_config
            SET config_value = ${stringValue}, updated_at = NOW()
            WHERE config_key = ${key}
          `
        } else {
          // Insert new
          await sql`
            INSERT INTO site_config (config_key, config_value, description, updated_at)
            VALUES (${key}, ${stringValue}, ${description}, NOW())
          `
        }

      } catch (configError) {
        console.error(`Error saving config ${key}:`, configError)
        throw configError
      }
    }


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving site config:", error)
    return NextResponse.json(
      {
        error: "Failed to save site config",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
