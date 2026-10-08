import { NextResponse } from "next/server"
import { getAuth } from "@/lib/auth"
import { sql } from "@/lib/sql"
import { MIN_PASSWORD_LENGTH, toLoginEmail } from "@/lib/backoffice-username"

async function hasAdminUser() {
  const result = await sql`SELECT id FROM "user" LIMIT 1`
  return result.length > 0
}

// Reports whether an admin account already exists, so the setup page
// knows whether to render the creation form.
export async function GET() {
  try {
    const exists = await hasAdminUser()
    return NextResponse.json({ hasAdmin: exists })
  } catch (error) {
    console.error("[setup] Error checking admin setup status:", error)
    return NextResponse.json({ error: "Error al verificar el estado" }, { status: 500 })
  }
}

// Creates the first backoffice admin account. Refuses once any user exists,
// so this endpoint can never be used to add extra accounts later.
export async function POST(request: Request) {
  try {
    if (await hasAdminUser()) {
      return NextResponse.json({ error: "Ya existe un administrador configurado" }, { status: 403 })
    }

    const body = await request.json()
    const { email: identifier, password, name } = body

    if (!identifier || !password || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Usuario y contraseña (mínimo ${MIN_PASSWORD_LENGTH} caracteres) son obligatorios` },
        { status: 400 },
      )
    }

    const auth = await getAuth()
    await auth.api.signUpEmail({
      body: { email: toLoginEmail(identifier), password, name: name || "Administrador" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[setup] Error creating first admin:", error)
    return NextResponse.json({ error: "Error al crear el administrador" }, { status: 500 })
  }
}
