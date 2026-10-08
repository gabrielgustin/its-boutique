import "server-only"
import { z } from "zod"
import { canOrderNow } from "@/lib/db"
import { ORDER_STATES, orderTotals, unitPrice, type CouponRule, type OrderState } from "@/lib/pricing"
import { query, sql, transaction, type Queryable } from "@/lib/sql"

export class OrderError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

const text = (max: number) => z.string().trim().max(max)

export const orderInput = z.object({
  customer: z.object({
    name: text(80).min(2, "Ingresá tu nombre"),
    phone: text(30).min(6, "Ingresá un teléfono de contacto"),
    address: text(200).optional(),
  }),
  deliveryMethodId: z.number().int().positive(),
  paymentMethodId: z.number().int().positive(),
  couponCode: text(50).optional(),
  notes: text(500).optional(),
  items: z
    .array(
      z.object({
        productId: text(100).min(1),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().min(1).max(99),
        note: text(300).optional(),
      }),
    )
    .min(1, "El pedido no tiene productos")
    .max(60),
})

export type OrderInput = z.infer<typeof orderInput>

/** Cupón vigente hoy con ese código, o null. */
export async function findCoupon(code: string | undefined, db: Queryable = { query }): Promise<CouponRule | null> {
  if (!code?.trim()) return null
  const [row] = await db.query(
    `SELECT code, discount_type, discount_value FROM coupons
     WHERE UPPER(code) = UPPER($1) AND is_active
       AND (start_date IS NULL OR start_date <= CURRENT_DATE)
       AND (end_date IS NULL OR end_date >= CURRENT_DATE)
     LIMIT 1`,
    [code.trim()],
  )
  return row ? { code: row.code, discount_type: row.discount_type, discount_value: Number(row.discount_value) } : null
}

/**
 * Crea un pedido. Todo se valida y se calcula acá con los datos de la base:
 * precios, descuentos, cupón y costo de envío. Del navegador solo se
 * aceptan los ids, las cantidades y los datos de contacto.
 */
export async function createOrder(input: OrderInput) {
  const { canOrder } = await canOrderNow()
  if (!canOrder) throw new OrderError("En este momento el local está cerrado y no toma pedidos.", 409)

  return transaction(async (tx) => {
    const [delivery] = await tx.sql`SELECT name, delivery_cost FROM delivery_methods WHERE id = ${input.deliveryMethodId} AND is_active`
    if (!delivery) throw new OrderError("La forma de entrega elegida ya no está disponible.")
    const [payment] = await tx.sql`SELECT name FROM payment_methods WHERE id = ${input.paymentMethodId} AND is_active`
    if (!payment) throw new OrderError("El método de pago elegido ya no está disponible.")

    const needsAddress = /env[ií]o|domicilio|delivery/i.test(delivery.name)
    if (needsAddress && !input.customer.address) throw new OrderError("Ingresá la dirección de entrega.")

    const lines: { productId: string; variantId: string | null; name: string; variantName: string | null; image: string | null; price: number; quantity: number; note: string | null }[] = []

    for (const item of input.items) {
      const [product] = await tx.sql`SELECT id, nombre, precio, descuento, imagen FROM productos WHERE id = ${item.productId} AND visible`
      if (!product) throw new OrderError("Uno de los productos del pedido ya no está disponible.", 409)

      const variants = await tx.sql`SELECT id, nombre, precio FROM producto_variantes WHERE producto_id = ${item.productId}`
      let basePrice = Number(product.precio)
      let variantName: string | null = null

      if (variants.length > 0) {
        const variant = variants.find((entry) => entry.id === item.variantId)
        if (!variant) throw new OrderError(`Elegí una opción para ${product.nombre}.`)
        basePrice = Number(variant.precio)
        variantName = variant.nombre
      }

      lines.push({
        productId: product.id,
        variantId: variants.length > 0 ? (item.variantId ?? null) : null,
        name: product.nombre,
        variantName,
        image: product.imagen,
        price: unitPrice(basePrice, Number(product.descuento)),
        quantity: item.quantity,
        note: item.note || null,
      })
    }

    const coupon = await findCoupon(input.couponCode, tx)
    if (input.couponCode && !coupon) throw new OrderError("El cupón no es válido o está vencido.")

    const totals = orderTotals(lines, coupon, Number(delivery.delivery_cost))

    const [order] = await tx.sql`
      INSERT INTO pedidos (cliente_nombre, cliente_telefono, cliente_direccion, notas, forma_entrega, metodo_pago,
                           subtotal, descuento, cupon_codigo, costo_envio, total)
      VALUES (${input.customer.name}, ${input.customer.phone}, ${input.customer.address || null}, ${input.notes || null},
              ${delivery.name}, ${payment.name}, ${totals.subtotal}, ${totals.discount}, ${coupon?.code ?? null},
              ${totals.delivery}, ${totals.total})
      RETURNING id, token
    `

    for (const line of lines) {
      await tx.sql`
        INSERT INTO pedido_items (pedido_id, producto_id, variante_id, nombre, variante_nombre, imagen, precio_unitario, cantidad, observacion)
        VALUES (${order.id}, ${line.productId}, ${line.variantId}, ${line.name}, ${line.variantName}, ${line.image}, ${line.price}, ${line.quantity}, ${line.note})
      `
    }

    return { id: order.id as number, token: order.token as string, total: totals.total }
  })
}

// ───────────── Lectura ─────────────

export interface OrderItem {
  id: number
  nombre: string
  variante_nombre: string | null
  imagen: string | null
  precio_unitario: number
  cantidad: number
  observacion: string | null
}

export interface Order {
  id: number
  token: string
  estado: OrderState
  cliente_nombre: string
  cliente_telefono: string
  cliente_direccion: string | null
  notas: string | null
  forma_entrega: string
  metodo_pago: string
  subtotal: number
  descuento: number
  cupon_codigo: string | null
  costo_envio: number
  total: number
  created_at: string
  items: OrderItem[]
}

function toOrder(row: any, items: any[]): Order {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: undefined,
    items: items.filter((item) => item.pedido_id === row.id).map(({ pedido_id: _pedido, producto_id: _producto, variante_id: _variante, ...item }) => item),
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getOrderByToken(token: string): Promise<Order | null> {
  if (!UUID.test(token)) return null
  const [row] = await sql`SELECT * FROM pedidos WHERE token = ${token}`
  if (!row) return null
  return toOrder(row, await sql`SELECT * FROM pedido_items WHERE pedido_id = ${row.id} ORDER BY id`)
}

export async function listOrders(options: { estado?: string; limit?: number } = {}): Promise<Order[]> {
  const limit = Math.min(200, Math.max(1, options.limit ?? 100))
  const estado = ORDER_STATES.includes(options.estado as OrderState) ? options.estado : null
  const rows = await sql`
    SELECT * FROM pedidos
    WHERE (${estado}::text IS NULL OR estado = ${estado})
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  if (!rows.length) return []
  const ids = rows.map((row) => row.id)
  const items = await sql`SELECT * FROM pedido_items WHERE pedido_id = ANY(${ids}::int[]) ORDER BY id`
  return rows.map((row) => toOrder(row, items))
}

/** Cambia el estado de un pedido. */
export async function setOrderState(id: number, estado: OrderState) {
  const updated = await sql`UPDATE pedidos SET estado = ${estado}, updated_at = NOW() WHERE id = ${id} RETURNING id`
  if (!updated.length) throw new OrderError("El pedido no existe.", 404)
}
