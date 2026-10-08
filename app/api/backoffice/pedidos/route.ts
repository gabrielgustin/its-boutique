import { NextResponse } from "next/server"
import { requireBackofficeSession } from "@/lib/backoffice-auth"
import { listOrders } from "@/lib/server/orders"

export async function GET(request: Request) {
  if (!(await requireBackofficeSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    const estado = new URL(request.url).searchParams.get("estado") ?? undefined
    return NextResponse.json(await listOrders({ estado }))
  } catch (error) {
    console.error("[pedidos] Error listando pedidos:", error)
    return NextResponse.json({ error: "No se pudieron cargar los pedidos" }, { status: 500 })
  }
}
