import { NextResponse } from "next/server"
import { OrderError, createOrder, orderInput } from "@/lib/server/orders"
import { rateLimit } from "@/lib/server/rate-limit"

export async function POST(request: Request) {
  if (!(await rateLimit("orders", 10, 600))) {
    return NextResponse.json({ error: "Demasiados pedidos seguidos. Probá de nuevo en unos minutos." }, { status: 429 })
  }

  const parsed = orderInput.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisá los datos del pedido." }, { status: 400 })
  }

  try {
    const order = await createOrder(parsed.data)
    return NextResponse.json({ success: true, token: order.token })
  } catch (error) {
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error("[orders] No se pudo crear el pedido:", error)
    return NextResponse.json({ error: "No pudimos registrar el pedido. Probá de nuevo." }, { status: 500 })
  }
}
