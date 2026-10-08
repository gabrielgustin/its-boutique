"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export interface CartItem {
  /** Producto + variante: identifica el renglón del carrito. */
  key: string
  productId: string
  variantId?: string
  categoryId: string
  categoryTitle?: string
  title: string
  variantName?: string
  /** Precio unitario mostrado. Al confirmar, el servidor lo recalcula. */
  price: number
  /** Precio sin descuento, para mostrarlo tachado. */
  listPrice?: number
  quantity: number
  imageUrl: string
  note?: string
}

interface CartContextValue {
  items: CartItem[]
  /** Falso hasta leer el carrito guardado: evita mostrar "carrito vacío" por un instante. */
  ready: boolean
  count: number
  subtotal: number
  add: (item: CartItem) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

const STORAGE_KEY = "its-boutique-cart-v1"
const CartContext = createContext<CartContextValue | null>(null)

const clamp = (quantity: number) => Math.max(1, Math.min(quantity, 99))

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
      if (Array.isArray(saved)) setItems(saved.filter((item) => item?.key && item?.productId && item.quantity > 0))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setReady(true)

    // Mantiene el carrito igual en todas las pestañas abiertas.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      try {
        setItems(JSON.parse(event.newValue ?? "[]"))
      } catch {
        setItems([])
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, ready])

  const add = useCallback((item: CartItem) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.key === item.key)
      if (!existing) return [...current, { ...item, quantity: clamp(item.quantity) }]
      return current.map((entry) =>
        entry.key === item.key
          ? { ...entry, ...item, quantity: clamp(entry.quantity + item.quantity), note: item.note || entry.note }
          : entry,
      )
    })
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0 ? current.filter((entry) => entry.key !== key) : current.map((entry) => (entry.key === key ? { ...entry, quantity: clamp(quantity) } : entry)),
    )
  }, [])

  const remove = useCallback((key: string) => setItems((current) => current.filter((entry) => entry.key !== key)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, ready, add, setQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider")
  return context
}
