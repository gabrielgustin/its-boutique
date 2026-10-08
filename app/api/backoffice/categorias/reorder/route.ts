import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function PATCH(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Se requiere una lista de ids" }, { status: 400 })
    }

    await Promise.all(
      ids.map((id: string, index: number) => sql`UPDATE categorias SET orden = ${index} WHERE id = ${id}`),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering categorias:", error)
    return NextResponse.json({ error: "Error al reordenar categorías" }, { status: 500 })
  }
}
