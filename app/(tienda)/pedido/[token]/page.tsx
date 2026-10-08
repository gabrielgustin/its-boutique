import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Check, CircleX, MessageCircle } from "lucide-react"
import { StoreImage } from "@/components/store/store-image"
import { PageBody, TitleBar } from "@/components/store/title-bar"
import { getStoreInfo } from "@/lib/db"
import { ORDER_STATE_LABEL, formatPrice, orderNumber, type OrderState } from "@/lib/pricing"
import { getOrderByToken, type Order } from "@/lib/server/orders"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } }

const STEPS: OrderState[] = ["nuevo", "confirmado", "preparando", "listo", "entregado"]

function whatsappMessage(order: Order, trackingUrl: string) {
  const lines = [
    `*Pedido ${orderNumber(order.id)}*`,
    `Nombre: ${order.cliente_nombre}`,
    `Teléfono: ${order.cliente_telefono}`,
    `Entrega: ${order.forma_entrega}`,
    order.cliente_direccion ? `Dirección: ${order.cliente_direccion}` : null,
    `Pago: ${order.metodo_pago}`,
    order.notas ? `Comentarios: ${order.notas}` : null,
    "",
    "*Productos*",
    ...order.items.map((item) => `• ${item.cantidad} × ${item.nombre}${item.variante_nombre ? ` (${item.variante_nombre})` : ""}: ${formatPrice(item.precio_unitario * item.cantidad)}${item.observacion ? `\n   _${item.observacion}_` : ""}`),
    "",
    `Subtotal: ${formatPrice(order.subtotal)}`,
    order.descuento > 0 ? `Descuento${order.cupon_codigo ? ` (${order.cupon_codigo})` : ""}: -${formatPrice(order.descuento)}` : null,
    order.costo_envio > 0 ? `Envío: ${formatPrice(order.costo_envio)}` : null,
    `*Total: ${formatPrice(order.total)}*`,
    "",
    `Seguimiento: ${trackingUrl}`,
  ]
  return lines.filter((line) => line !== null).join("\n")
}

export default async function OrderPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ nuevo?: string }> }) {
  const [{ token }, { nuevo }] = await Promise.all([params, searchParams])
  const [order, store] = await Promise.all([getOrderByToken(token), getStoreInfo()])
  if (!order) notFound()

  const base = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
  const whatsappHref = store.whatsapp ? `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(whatsappMessage(order, `${base}/pedido/${order.token}`))}` : null
  const cancelled = order.estado === "cancelado"
  const current = STEPS.indexOf(order.estado)
  const date = new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short", timeZone: process.env.STORE_TIME_ZONE || "America/Argentina/Buenos_Aires" }).format(new Date(order.created_at))

  return (
    <>
    <TitleBar title="Tu pedido" backHref="/" />
    <PageBody narrow>
    <div className="space-y-5">
      <header className="st-card p-5 text-center md:p-8">
        <span className={cn("mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full", cancelled ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
          {cancelled ? <CircleX className="h-7 w-7" aria-hidden /> : <Check className="h-7 w-7" aria-hidden />}
        </span>
        <h1 className="st-heading text-2xl font-semibold md:text-3xl">{cancelled ? "Pedido cancelado" : nuevo ? "¡Recibimos tu pedido!" : `Pedido ${orderNumber(order.id)}`}</h1>
        <p className="mt-1 text-sm text-st-muted">
          {nuevo && !cancelled ? `Pedido ${orderNumber(order.id)} · ` : ""}
          {date}
        </p>

        {whatsappHref && !cancelled && (
          <>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-st-btn bg-[#25d366] px-5 py-3.5 text-sm font-bold text-[#0b3d1f] transition hover:brightness-105 st-focus sm:w-auto">
              <MessageCircle className="h-5 w-5" aria-hidden />
              Enviar pedido por WhatsApp
            </a>
            {nuevo && <p className="mt-2 text-xs text-st-muted">Envianos el pedido por WhatsApp para coordinar el pago y la entrega.</p>}
          </>
        )}
      </header>

      {!cancelled && (
        <section className="st-card p-5" aria-label="Estado del pedido">
          <ol className="flex items-start">
            {STEPS.map((step, index) => {
              const done = index <= current
              return (
                <li key={step} className="relative flex flex-1 flex-col items-center text-center" aria-current={index === current ? "step" : undefined}>
                  {index > 0 && <span className={cn("absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2", done ? "bg-st-primary" : "bg-st-border")} aria-hidden />}
                  <span className={cn("relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold", done ? "border-st-primary bg-st-primary text-st-primary-fg" : "border-st-border bg-st-card text-st-muted")}>
                    {done ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                  </span>
                  <span className={cn("mt-1.5 px-0.5 text-[11px] leading-tight sm:text-xs", index === current ? "font-semibold text-st-heading" : "text-st-muted")}>{ORDER_STATE_LABEL[step]}</span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="st-card p-5">
        <h2 className="st-heading mb-3 text-lg font-semibold">Detalle</h2>
        <ul className="divide-y divide-st-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
              <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded bg-st-text/5">
                <StoreImage src={item.imagen || "/placeholder.svg"} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.nombre}</span>
                <span className="text-st-muted">
                  {item.variante_nombre ? `${item.variante_nombre} · ` : ""}× {item.cantidad}
                </span>
                {item.observacion && <span className="block text-xs italic text-st-muted">“{item.observacion}”</span>}
              </span>
              <span className="font-semibold">{formatPrice(item.precio_unitario * item.cantidad)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-st-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-st-muted">Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {order.descuento > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Descuento{order.cupon_codigo ? ` (${order.cupon_codigo})` : ""}</dt>
              <dd>- {formatPrice(order.descuento)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-st-muted">Envío</dt>
            <dd>{order.costo_envio > 0 ? formatPrice(order.costo_envio) : "Gratis"}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-st-border pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="text-xl text-st-price">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="st-card grid gap-3 p-5 text-sm sm:grid-cols-2">
        <div>
          <h2 className="mb-1 font-semibold text-st-heading">Entrega</h2>
          <p>{order.forma_entrega}</p>
          {order.cliente_direccion && <p className="text-st-muted">{order.cliente_direccion}</p>}
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-st-heading">Pago</h2>
          <p>{order.metodo_pago}</p>
        </div>
        {order.notas && (
          <div className="sm:col-span-2">
            <h2 className="mb-1 font-semibold text-st-heading">Comentarios</h2>
            <p className="whitespace-pre-line text-st-muted">{order.notas}</p>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-st-muted">Guardá este enlace para seguir el estado de tu pedido.</p>
      <div className="text-center">
        <Link href="/" className="st-btn-outline st-focus">
          Seguir comprando
        </Link>
      </div>
    </div>
    </PageBody>
    </>
  )
}
