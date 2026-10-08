import { NextResponse } from "next/server"
import { requireBackofficeSession } from "@/lib/backoffice-auth"
import { ORDER_STATES, type OrderState } from "@/lib/pricing"
import { OrderError, setOrderState } from "@/lib/server/orders"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBackofficeSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const id = Number((await params).id)
  const { estado } = (await request.json().catch(() => ({}))) as { estado?: string }
  if (!Number.isInteger(id) || !ORDER_STATES.includes(estado as OrderState)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  try {
    await setOrderState(id, estado as OrderState)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error("[pedidos] Error cambiando el estado:", error)
    return NextResponse.json({ error: "No se pudo actualizar el pedido" }, { status: 500 })
  }
}
