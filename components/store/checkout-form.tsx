"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Loader2, Tag, X } from "lucide-react"
import { useCart } from "@/components/store/cart"
import { CartSkeleton, EmptyCart } from "@/components/store/cart-view"
import { StoreImage } from "@/components/store/store-image"
import { useStoreText } from "@/components/site-theme"
import { couponDiscount, formatPrice, type CouponRule } from "@/lib/pricing"
import { cn } from "@/lib/utils"

interface Options {
  deliveryMethods: { id: number; name: string; cost: number; is_default: boolean }[]
  paymentMethods: { id: number; name: string; is_default: boolean }[]
}

const CONTACT_KEY = "its-boutique-contact-v1"
const needsAddress = (name: string) => /env[ií]o|domicilio|delivery/i.test(name)

export function CheckoutForm({ options, canOrder }: { options: Options; canOrder: boolean }) {
  const router = useRouter()
  const { items, ready, subtotal, clear } = useCart()
  const submitLabel = useStoreText("checkoutButton", "Confirmar pedido")

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [deliveryId, setDeliveryId] = useState<number | null>(options.deliveryMethods.length === 1 ? options.deliveryMethods[0].id : (options.deliveryMethods.find((method) => method.is_default)?.id ?? null))
  const [paymentId, setPaymentId] = useState<number | null>(options.paymentMethods.length === 1 ? options.paymentMethods[0].id : null)
  const [couponText, setCouponText] = useState("")
  const [coupon, setCoupon] = useState<CouponRule | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Recuerda los datos de contacto en este dispositivo para la próxima compra.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) ?? "{}")
      if (typeof saved.name === "string") setName(saved.name)
      if (typeof saved.phone === "string") setPhone(saved.phone)
      if (typeof saved.address === "string") setAddress(saved.address)
    } catch {
      localStorage.removeItem(CONTACT_KEY)
    }
  }, [])

  const delivery = options.deliveryMethods.find((method) => method.id === deliveryId) ?? null
  const withAddress = delivery ? needsAddress(delivery.name) : false
  const totals = useMemo(() => {
    const discount = couponDiscount(subtotal, coupon)
    const shipping = delivery?.cost ?? 0
    return { discount, shipping, total: subtotal - discount + shipping }
  }, [subtotal, coupon, delivery])

  async function applyCoupon() {
    const code = couponText.trim()
    if (!code) return
    setCheckingCoupon(true)
    setCouponError(null)
    try {
      const response = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, subtotal }) })
      const data = await response.json()
      if (data.success) {
        setCoupon(data.coupon)
        setCouponText("")
      } else setCouponError(data.error ?? "Cupón inválido")
    } catch {
      setCouponError("No se pudo validar el cupón")
    } finally {
      setCheckingCoupon(false)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!deliveryId) return setError("Elegí una forma de entrega.")
    if (!paymentId) return setError("Elegí un método de pago.")

    setSending(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, phone, address: withAddress ? address : undefined },
          deliveryMethodId: deliveryId,
          paymentMethodId: paymentId,
          couponCode: coupon?.code,
          notes: notes || undefined,
          items: items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, note: item.note })),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.token) {
        setError(data.error ?? "No pudimos registrar el pedido. Probá de nuevo.")
        return
      }
      localStorage.setItem(CONTACT_KEY, JSON.stringify({ name, phone, address }))
      setSent(true)
      router.push(`/pedido/${data.token}?nuevo=1`)
      clear()
    } catch {
      setError("No hay conexión. Revisá tu internet y probá de nuevo.")
    } finally {
      setSending(false)
    }
  }

  if (!ready) return <CartSkeleton />
  if (sent) {
    return (
      <p className="flex items-center justify-center gap-2 py-20 text-st-muted" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Registrando tu pedido…
      </p>
    )
  }
  if (items.length === 0) return <EmptyCart />

  const option = (active: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-3 rounded-st-btn border px-4 py-3 text-left text-sm font-medium transition st-focus",
      active ? "border-st-primary bg-st-primary/5 ring-1 ring-st-primary" : "border-st-border bg-st-card hover:border-st-primary",
    )

  return (
    <form onSubmit={submit} className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem] md:items-start md:gap-8">
      <div className="space-y-6">
        {!canOrder && (
          <p role="alert" className="rounded-st border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            El local está cerrado y en este momento no toma pedidos. <Link href="/contacto" className="font-semibold underline">Ver horarios</Link>
          </p>
        )}

        <fieldset className="st-card space-y-4 p-4 md:p-5">
          <legend className="st-heading float-left mb-3 w-full text-lg font-semibold">Tus datos</legend>
          <div className="clear-both grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Nombre y apellido</span>
              <input className="st-input" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required minLength={2} maxLength={80} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Teléfono</span>
              <input className="st-input" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required minLength={6} maxLength={30} placeholder="Ej: 11 2345 6789" />
            </label>
          </div>
        </fieldset>

        <fieldset className="st-card p-4 md:p-5">
          <legend className="st-heading float-left mb-3 w-full text-lg font-semibold">Forma de entrega</legend>
          {options.deliveryMethods.length === 0 ? (
            <p className="clear-both text-sm text-st-muted">No hay formas de entrega disponibles.</p>
          ) : (
            <div role="radiogroup" aria-label="Forma de entrega" className="clear-both grid gap-2 sm:grid-cols-2">
              {options.deliveryMethods.map((method) => (
                <button key={method.id} type="button" role="radio" aria-checked={deliveryId === method.id} className={option(deliveryId === method.id)} onClick={() => setDeliveryId(method.id)}>
                  <span>{method.name}</span>
                  <span className="flex items-center gap-2 text-st-muted">
                    {method.cost > 0 ? formatPrice(method.cost) : "Gratis"}
                    {deliveryId === method.id && <Check className="h-4 w-4 text-st-primary" aria-hidden />}
                  </span>
                </button>
              ))}
            </div>
          )}
          {withAddress && (
            <label className="mt-4 block space-y-1.5">
              <span className="text-sm font-medium">Dirección de entrega</span>
              <input className="st-input" value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" required maxLength={200} placeholder="Calle, número, piso, localidad" />
            </label>
          )}
        </fieldset>

        <fieldset className="st-card p-4 md:p-5">
          <legend className="st-heading float-left mb-3 w-full text-lg font-semibold">Método de pago</legend>
          {options.paymentMethods.length === 0 ? (
            <p className="clear-both text-sm text-st-muted">No hay métodos de pago disponibles.</p>
          ) : (
            <div role="radiogroup" aria-label="Método de pago" className="clear-both grid gap-2 sm:grid-cols-2">
              {options.paymentMethods.map((method) => (
                <button key={method.id} type="button" role="radio" aria-checked={paymentId === method.id} className={option(paymentId === method.id)} onClick={() => setPaymentId(method.id)}>
                  <span>{method.name}</span>
                  {paymentId === method.id && <Check className="h-4 w-4 text-st-primary" aria-hidden />}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        <div className="st-card p-4 md:p-5">
          <label htmlFor="notas" className="st-heading mb-3 block text-lg font-semibold">
            Comentarios <span className="text-sm font-normal text-st-muted">(opcional)</span>
          </label>
          <textarea id="notas" className="st-input resize-none" rows={2} maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Horario de entrega, con cuánto pagás, etc." />
        </div>
      </div>

      <aside className="st-card p-4 md:sticky md:top-32 md:p-5">
        <h2 className="st-heading mb-3 text-lg font-semibold">Resumen</h2>
        <ul className="mb-4 space-y-3">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 text-sm">
              <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-st-text/5">
                <StoreImage src={item.imageUrl} alt="" fill sizes="40px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.title}</span>
                <span className="text-st-muted">
                  {item.variantName ? `${item.variantName} · ` : ""}× {item.quantity}
                </span>
              </span>
              <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-st-border pt-4">
          {coupon ? (
            <p className="flex items-center justify-between gap-2 rounded-st-btn bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4" aria-hidden /> Cupón {coupon.code}
              </span>
              <button type="button" onClick={() => setCoupon(null)} aria-label="Quitar cupón" className="rounded-full p-1 hover:bg-emerald-100 st-focus">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </p>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  className="st-input py-2.5 text-sm uppercase placeholder:normal-case"
                  value={couponText}
                  onChange={(event) => setCouponText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      void applyCoupon()
                    }
                  }}
                  placeholder="Código de cupón"
                  aria-label="Código de cupón"
                  maxLength={50}
                />
                <button type="button" className="st-btn-outline shrink-0 px-4 py-2.5 st-focus" onClick={applyCoupon} disabled={checkingCoupon || !couponText.trim()}>
                  {checkingCoupon ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Aplicar"}
                </button>
              </div>
              {couponError && (
                <p role="alert" className="mt-1.5 text-sm text-red-600">
                  {couponError}
                </p>
              )}
            </div>
          )}
        </div>

        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-st-muted">Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Descuento</dt>
              <dd>- {formatPrice(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-st-muted">Envío</dt>
            <dd>{!delivery ? "A definir" : totals.shipping > 0 ? formatPrice(totals.shipping) : "Gratis"}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-st-border pt-3 text-base font-bold">
            <dt>Total</dt>
            <dd className="text-xl text-st-price">{formatPrice(totals.total)}</dd>
          </div>
        </dl>

        {error && (
          <p role="alert" className="mt-4 rounded-st-btn border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800">
            {error}
          </p>
        )}

        <button type="submit" className="st-btn mt-4 w-full py-3.5 st-focus" disabled={sending || !canOrder}>
          {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {sending ? "Enviando…" : submitLabel}
        </button>
        <p className="mt-2 text-center text-xs text-st-muted">Al confirmar vas a poder enviarnos el pedido por WhatsApp.</p>
      </aside>
    </form>
  )
}
