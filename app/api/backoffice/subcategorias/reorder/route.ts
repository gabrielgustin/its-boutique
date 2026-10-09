import { NextResponse } from "next/server"
import { transaction } from "@/lib/sql"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

// Guarda el orden de las subcategorías de una categoría: `ids` viene en el orden deseado.
export async function PATCH(request: Request) {
  try {
    if (!(await requireBackofficeSession())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { categoriaId, ids } = await request.json()
    if (!categoriaId || !Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string")) {
      return NextResponse.json({ error: "Se requiere categoriaId y una lista de ids" }, { status: 400 })
    }

    // El WHERE categoria_id acota la actualización a esa categoría, así este endpoint no puede
    // reordenar subcategorías de otra. Todo se guarda junto o no se guarda nada.
    await transaction(async (tx) => {
      for (const [index, id] of (ids as string[]).entries()) {
        await tx.sql`UPDATE subcategorias SET orden = ${index} WHERE id = ${id} AND categoria_id = ${categoriaId}`
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering subcategorias:", error)
    return NextResponse.json({ error: "Error al reordenar subcategorías" }, { status: 500 })
  }
}
