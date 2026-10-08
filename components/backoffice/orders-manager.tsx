"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronDown, ExternalLink, MessageCircle, RefreshCw } from "lucide-react"
import { ORDER_STATES, ORDER_STATE_LABEL, formatPrice, orderNumber, type OrderState } from "@/lib/pricing"
import { cn } from "@/lib/utils"

interface OrderItem {
  id: number
  nombre: string
  variante_nombre: string | null
  precio_unitario: number
  cantidad: number
  observacion: string | null
}

interface Order {
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

type Filter = "pendientes" | "todos" | OrderState

const PENDING: OrderState[] = ["nuevo", "confirmado", "preparando", "listo"]

const STATE_STYLE: Record<OrderState, string> = {
  nuevo: "bg-blue-100 text-blue-800",
  confirmado: "bg-indigo-100 text-indigo-800",
  preparando: "bg-amber-100 text-amber-800",
  listo: "bg-teal-100 text-teal-800",
  entregado: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-gray-200 text-gray-600",
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pendientes", label: "En curso" },
  { id: "todos", label: "Todos" },
  { id: "entregado", label: "Entregados" },
  { id: "cancelado", label: "Cancelados" },
]

// Zona y formato fijos (24 h): el servidor y el navegador tienen que escribir exactamente lo mismo,
// si no React avisa de un desajuste al hidratar.
const dateFormat = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
const formatDate = (iso: string) => dateFormat.format(new Date(iso))

export function OrdersManager({ initial, initialFilter, storeName }: { initial: Order[]; initialFilter: Filter; storeName: string }) {
  const [orders, setOrders] = useState(initial)
  const [filter, setFilter] = useState<Filter>(initialFilter)
  const [open, setOpen] = useState<number | null>(null)
  const [saving, setSaving] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/backoffice/pedidos", { cache: "no-store" })
      if (response.ok) setOrders(await response.json())
    } finally {
      setLoading(false)
    }
  }, [])

  // Los pedidos nuevos aparecen solos: se vuelve a consultar cada 30 segundos con la pestaña a la vista.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void reload()
    }, 30_000)
    return () => clearInterval(timer)
  }, [reload])

  const visible = useMemo(
    () => orders.filter((order) => (filter === "todos" ? true : filter === "pendientes" ? PENDING.includes(order.estado) : order.estado === filter)),
    [orders, filter],
  )

  async function changeState(order: Order, estado: OrderState) {
    if (estado === order.estado) return
    if (estado === "cancelado" && !window.confirm(`¿Cancelar el pedido ${orderNumber(order.id)}?`)) return
    setSaving(order.id)
    setError(null)
    try {
      const response = await fetch(`/api/backoffice/pedidos/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error ?? "No se pudo actualizar el pedido")
      setOrders((current) => current.map((entry) => (entry.id === order.id ? { ...entry, estado } : entry)))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar el pedido")
    } finally {
      setSaving(null)
    }
  }

  const whatsappHref = (order: Order) => {
    const phone = order.cliente_telefono.replace(/\D/g, "")
    const text = `Hola ${order.cliente_nombre.split(" ")[0]}, te escribimos de ${storeName} por tu pedido ${orderNumber(order.id)}.`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap gap-1.5" role="group" aria-label="Filtrar pedidos">
          {FILTERS.map(({ id, label }) => {
            const count = orders.filter((order) => (id === "todos" ? true : id === "pendientes" ? PENDING.includes(order.estado) : order.estado === id)).length
            return (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={cn("rounded-md px-3.5 py-2 text-sm font-medium transition", filter === id ? "bg-[#1e4b8e] text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:text-gray-900")}
              >
                {label} <span className="opacity-70">({count})</span>
              </button>
            )
          })}
        </div>
        <button type="button" onClick={reload} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition hover:text-[#1e4b8e] disabled:opacity-50">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
          Actualizar
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="rounded-lg bg-white px-4 py-14 text-center text-gray-500 ring-1 ring-gray-100">{orders.length === 0 ? "Todavía no recibiste pedidos. Cuando un cliente confirme una compra, va a aparecer acá." : "No hay pedidos en esta vista."}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => {
            const expanded = open === order.id
            return (
              <li key={order.id} className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                <button type="button" onClick={() => setOpen(expanded ? null : order.id)} aria-expanded={expanded} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-gray-900">{orderNumber(order.id)}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STATE_STYLE[order.estado])}>{ORDER_STATE_LABEL[order.estado]}</span>
                      <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-gray-600">
                      {order.cliente_nombre} · {order.forma_entrega} · {order.items.reduce((sum, item) => sum + item.cantidad, 0)} u.
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-gray-900">{formatPrice(order.total)}</span>
                  <ChevronDown className={cn("h-5 w-5 shrink-0 text-gray-400 transition-transform", expanded && "rotate-180")} aria-hidden />
                </button>

                {expanded && (
                  <div className="space-y-4 border-t border-gray-100 px-4 py-4">
                    <div className="grid gap-4 text-sm md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">Cliente</p>
                        <p>{order.cliente_nombre}</p>
                        <p className="text-gray-600">{order.cliente_telefono}</p>
                        {order.cliente_direccion && <p className="text-gray-600">{order.cliente_direccion}</p>}
                        <p className="pt-1 text-gray-600">
                          Entrega: {order.forma_entrega} · Pago: {order.metodo_pago}
                        </p>
                        {order.notas && <p className="rounded bg-amber-50 px-2 py-1.5 text-amber-900">“{order.notas}”</p>}
                      </div>
                      <div>
                        <p className="mb-1 font-semibold text-gray-900">Productos</p>
                        <ul className="divide-y divide-gray-100">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between gap-3 py-1.5">
                              <span className="min-w-0">
                                {item.cantidad} × {item.nombre}
                                {item.variante_nombre && <span className="text-gray-500"> ({item.variante_nombre})</span>}
                                {item.observacion && <span className="block text-xs italic text-gray-500">“{item.observacion}”</span>}
                              </span>
                              <span className="shrink-0 text-gray-700">{formatPrice(item.precio_unitario * item.cantidad)}</span>
                            </li>
                          ))}
                        </ul>
                        <dl className="mt-2 space-y-0.5 border-t border-gray-100 pt-2 text-gray-600">
                          <div className="flex justify-between">
                            <dt>Subtotal</dt>
                            <dd>{formatPrice(order.subtotal)}</dd>
                          </div>
                          {order.descuento > 0 && (
                            <div className="flex justify-between">
                              <dt>Descuento{order.cupon_codigo ? ` (${order.cupon_codigo})` : ""}</dt>
                              <dd>- {formatPrice(order.descuento)}</dd>
                            </div>
                          )}
                          {order.costo_envio > 0 && (
                            <div className="flex justify-between">
                              <dt>Envío</dt>
                              <dd>{formatPrice(order.costo_envio)}</dd>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-gray-900">
                            <dt>Total</dt>
                            <dd>{formatPrice(order.total)}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        Estado
                        <select
                          value={order.estado}
                          disabled={saving === order.id}
                          onChange={(event) => changeState(order, event.target.value as OrderState)}
                          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1e4b8e] focus:outline-none focus:ring-2 focus:ring-[#1e4b8e]/20 disabled:opacity-50"
                        >
                          {ORDER_STATES.map((state) => (
                            <option key={state} value={state}>
                              {ORDER_STATE_LABEL[state]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <a href={whatsappHref(order)} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-2 rounded-md bg-[#25d366] px-3.5 py-2 text-sm font-semibold text-[#0b3d1f] transition hover:brightness-105">
                        <MessageCircle className="h-4 w-4" aria-hidden /> Escribir al cliente
                      </a>
                      <a href={`/pedido/${order.token}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition hover:text-[#1e4b8e]">
                        <ExternalLink className="h-4 w-4" aria-hidden /> Ver como cliente
                      </a>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
