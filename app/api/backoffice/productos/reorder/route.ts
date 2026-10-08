import { NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

export async function PATCH(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { categoriaId, ids } = body

    if (!categoriaId || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Se requiere categoriaId y una lista de ids" }, { status: 400 })
    }

    // El WHERE categoria acota la actualización a la categoría indicada, evitando
    // que se puedan reordenar productos de otra categoría desde este endpoint.
    await Promise.all(
      ids.map(
        (id: string, index: number) =>
          sql`UPDATE productos SET orden = ${index} WHERE id = ${id} AND categoria = ${categoriaId}`,
      ),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering productos:", error)
    return NextResponse.json({ error: "Error al reordenar productos" }, { status: 500 })
  }
}
