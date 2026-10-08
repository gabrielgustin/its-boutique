import { NextResponse } from "next/server"
import { requireBackofficeSession } from "@/lib/backoffice-auth"
import { getTheme, saveTheme } from "@/lib/db"

export async function GET() {
  if (!(await requireBackofficeSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  return NextResponse.json(await getTheme())
}

export async function PUT(request: Request) {
  if (!(await requireBackofficeSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    const theme = await saveTheme(await request.json())
    return NextResponse.json({ success: true, theme })
  } catch (error) {
    console.error("[theme] Error guardando el diseño:", error)
    return NextResponse.json({ error: "No se pudo guardar el diseño" }, { status: 500 })
  }
}
