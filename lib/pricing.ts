// Reglas de precios, compartidas por la tienda (para mostrar) y el servidor (para cobrar).
// El servidor siempre recalcula con estas funciones: nunca confía en un total que venga del navegador.

/** Precio final de una unidad, aplicando el descuento del producto (0 a 100 %). */
export function unitPrice(basePrice: number, discountPercent = 0): number {
  const discount = Math.min(100, Math.max(0, discountPercent || 0))
  return Math.round(basePrice * (1 - discount / 100))
}

export interface CouponRule {
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
}

/** Cuánto descuenta un cupón sobre un subtotal. Nunca más que el subtotal. */
export function couponDiscount(subtotal: number, coupon: CouponRule | null): number {
  if (!coupon || subtotal <= 0) return 0
  const raw = coupon.discount_type === "percentage" ? (subtotal * coupon.discount_value) / 100 : coupon.discount_value
  return Math.min(subtotal, Math.max(0, Math.round(raw)))
}

export interface Totals {
  subtotal: number
  discount: number
  delivery: number
  total: number
}

export function orderTotals(lines: { price: number; quantity: number }[], coupon: CouponRule | null, deliveryCost = 0): Totals {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const discount = couponDiscount(subtotal, coupon)
  const delivery = Math.max(0, Math.round(deliveryCost))
  return { subtotal, discount, delivery, total: subtotal - discount + delivery }
}

export const formatPrice = (value: number | null | undefined) => `$ ${Math.round(value ?? 0).toLocaleString("es-AR")}`

/** Número de pedido que ve el cliente y el negocio. */
export const orderNumber = (id: number) => `#${String(id).padStart(5, "0")}`

export const ORDER_STATES = ["nuevo", "confirmado", "preparando", "listo", "entregado", "cancelado"] as const
export type OrderState = (typeof ORDER_STATES)[number]

export const ORDER_STATE_LABEL: Record<OrderState, string> = {
  nuevo: "Recibido",
  confirmado: "Confirmado",
  preparando: "En preparación",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
}
