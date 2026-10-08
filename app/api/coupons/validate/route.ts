import { NextResponse } from "next/server"
import { couponDiscount } from "@/lib/pricing"
import { findCoupon } from "@/lib/server/orders"
import { rateLimit } from "@/lib/server/rate-limit"

// Solo responde si UN código es válido. No existe ninguna ruta pública que liste cupones.
export async function POST(request: Request) {
  if (!(await rateLimit("coupon", 12, 600))) {
    return NextResponse.json({ success: false, error: "Demasiados intentos. Probá de nuevo en unos minutos." }, { status: 429 })
  }

  const body = (await request.json().catch(() => ({}))) as { code?: unknown; subtotal?: unknown }
  const code = typeof body.code === "string" ? body.code.slice(0, 50) : ""
  if (!code.trim()) return NextResponse.json({ success: false, error: "Ingresá un código de cupón" }, { status: 400 })

  try {
    const coupon = await findCoupon(code)
    if (!coupon) return NextResponse.json({ success: false, error: "Cupón inválido o vencido" }, { status: 404 })
    const subtotal = Math.max(0, Number(body.subtotal) || 0)
    // El monto es orientativo: al crear el pedido el servidor lo vuelve a calcular.
    return NextResponse.json({ success: true, coupon: { ...coupon, discount_amount: couponDiscount(subtotal, coupon) } })
  } catch (error) {
    console.error("[coupons] Error validando cupón:", error)
    return NextResponse.json({ success: false, error: "No se pudo validar el cupón" }, { status: 500 })
  }
}
