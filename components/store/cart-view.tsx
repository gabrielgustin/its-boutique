"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { useCart, type CartItem } from "@/components/store/cart"
import { StoreImage } from "@/components/store/store-image"
import { formatPrice } from "@/lib/pricing"
import { cn } from "@/lib/utils"

function SmallStepper({ item }: { item: CartItem }) {
  const { setQuantity } = useCart()
  const button = "flex h-8 w-8 items-center justify-center text-st-primary transition disabled:opacity-30 st-focus"
  return (
    <div className="inline-flex items-center rounded-lg border border-st-border bg-st-card" role="group" aria-label="Cantidad">
      <button type="button" className={button} onClick={() => setQuantity(item.key, item.quantity - 1)} aria-label="Quitar uno">
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <span className="w-7 text-center text-sm font-black tabular-nums" aria-live="polite">
        {item.quantity}
      </span>
      <button type="button" className={button} onClick={() => setQuantity(item.key, item.quantity + 1)} disabled={item.quantity >= 99} aria-label="Agregar uno">
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}

function CartLine({ item }: { item: CartItem }) {
  const { remove } = useCart()
  const [open, setOpen] = useState(false)
  const listTotal = (item.listPrice ?? item.price) * item.quantity
  const total = item.price * item.quantity

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <Link href={`/productos/${item.categoryId}/${item.productId}`} className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg border border-st-border bg-white st-focus">
          <StoreImage src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-snug text-st-heading">{item.title}</p>
          {item.variantName && <p className="text-sm text-st-muted">{item.variantName}</p>}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 border-l-4 border-st-accent/70 pl-3">
        <SmallStepper item={item} />
        <span className="ml-auto text-right leading-tight">
          {listTotal > total && <span className="block text-xs text-st-muted line-through">{formatPrice(listTotal)}</span>}
          <span className="block font-bold text-st-price">{formatPrice(total)}</span>
        </span>
        <button type="button" onClick={() => remove(item.key)} aria-label={`Quitar ${item.title}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-st-accent transition hover:bg-st-accent/10 st-focus">
          <Trash2 className="h-5 w-5" aria-hidden />
        </button>
        {item.note && (
          <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Ver observación" className="inline-flex h-9 w-6 items-center justify-center text-st-muted st-focus">
            <ChevronRight className={cn("h-5 w-5 transition-transform", open && "rotate-90")} aria-hidden />
          </button>
        )}
      </div>
      {item.note && open && <p className="mt-2 rounded-lg bg-st-text/5 px-3 py-2 text-sm italic text-st-muted">“{item.note}”</p>}
    </li>
  )
}

export function EmptyCart() {
  return (
    <div className="st-raised mx-auto max-w-md px-6 py-14 text-center">
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-st-primary/10 text-st-primary">
        <ShoppingCart className="h-7 w-7" aria-hidden />
      </span>
      <p className="text-xl font-bold text-st-heading">Tu pedido está vacío</p>
      <p className="mt-1 text-sm text-st-muted">Sumá productos para armar tu pedido.</p>
      <Link href="/" className="st-btn mt-6 st-focus">
        Ver productos
      </Link>
    </div>
  )
}

export function CartSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="st-skeleton h-12" />
      <div className="st-skeleton h-28" />
    </div>
  )
}

export function CartView() {
  const { items, ready, subtotal } = useCart()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const groups = useMemo(() => {
    const map = new Map<string, { title: string; items: CartItem[] }>()
    for (const item of items) {
      const group = map.get(item.categoryId) ?? { title: item.categoryTitle || "Productos", items: [] }
      group.items.push(item)
      map.set(item.categoryId, group)
    }
    return [...map.entries()]
  }, [items])

  if (!ready) return <CartSkeleton />
  if (items.length === 0) return <EmptyCart />

  const listTotal = items.reduce((sum, item) => sum + (item.listPrice ?? item.price) * item.quantity, 0)

  return (
    <>
      <div className="space-y-4">
        {groups.map(([id, group]) => {
          const isCollapsed = collapsed[id]
          return (
            <section key={id} className="st-raised overflow-hidden">
              <button type="button" onClick={() => setCollapsed({ ...collapsed, [id]: !isCollapsed })} aria-expanded={!isCollapsed} className="flex w-full items-center justify-between gap-2 bg-st-primary px-4 py-3 text-left font-bold text-st-primary-fg st-focus">
                <span>
                  {group.title} <span className="font-normal opacity-80">({group.items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                </span>
                <ChevronDown className={cn("h-5 w-5 transition-transform", isCollapsed && "-rotate-90")} aria-hidden />
              </button>
              {!isCollapsed && (
                <ul className="divide-y divide-st-border px-4">
                  {group.items.map((item) => (
                    <CartLine key={item.key} item={item} />
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-st-border bg-st-card px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-3px_12px_rgba(0,0,0,0.1)]">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 flex items-end justify-between">
            <span className="font-bold text-st-heading">
              Total <span className="text-xs font-normal text-st-muted">(el envío se suma en el paso siguiente)</span>
            </span>
            <span className="text-right leading-tight">
              {listTotal > subtotal && <span className="block text-sm text-st-muted line-through">{formatPrice(listTotal)}</span>}
              <span className="block text-2xl font-black text-st-price">{formatPrice(subtotal)}</span>
            </span>
          </div>
          <Link href="/finalizar-pedido" className="st-btn w-full py-3.5 text-lg st-focus">
            Confirmar pedido
          </Link>
        </div>
      </div>
    </>
  )
}
