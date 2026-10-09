"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Facebook, Globe, Home, Info, Instagram, Loader2, Lock, Menu, MessageCircle, Search, ShoppingCart, X } from "lucide-react"
import { useCart } from "@/components/store/cart"
import { StoreImage } from "@/components/store/store-image"
import { useSiteTheme, useStoreText } from "@/components/site-theme"
import { productHref } from "@/lib/catalog-links"
import { formatPrice, unitPrice } from "@/lib/pricing"
import { DEFAULT_LOGO_URL } from "@/lib/theme"
import { cn } from "@/lib/utils"

export interface StoreInfo {
  siteName: string
  logoUrl: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  websiteUrl: string | null
  whatsappUrl: string | null
}

const iconButton = "relative inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-current/10 st-focus"

/** Pantallas con su propia barra de acción al pie: ahí no va "Ver mi pedido". */
function useFocusedFlow() {
  const pathname = usePathname()
  const isProduct = pathname.split("/").filter(Boolean).length === 3 && pathname.startsWith("/productos/")
  return isProduct || pathname === "/carrito" || pathname === "/finalizar-pedido" || pathname.startsWith("/pedido/")
}

export function StoreShell({ store }: { store: StoreInfo }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const theme = useSiteTheme()
  const { count, ready } = useCart()
  const focused = useFocusedFlow()
  const logo = theme.logoUrl ?? store.logoUrl ?? DEFAULT_LOGO_URL
  const centered = theme.logoAlign === "center"

  // Al navegar se cierran el menú y el buscador.
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-black/5 bg-st-header text-st-header-fg">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-1 px-2 text-st-primary md:px-4">
          <button type="button" className={iconButton} onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <Menu className="h-8 w-8" strokeWidth={2.5} aria-hidden />
          </button>

          <Link href="/" aria-label={`${store.siteName}: inicio`} className={cn("flex min-w-0 items-center rounded st-focus", centered ? "absolute left-1/2 -translate-x-1/2" : "ml-1")}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={store.siteName} className="w-auto max-w-[12rem] object-contain" style={{ height: "var(--st-logo-h)" }} />
            ) : (
              <span className="st-title truncate text-2xl">{store.siteName}</span>
            )}
          </Link>

          <div className="ml-auto hidden items-center md:flex">
            <Link href="/carrito" className={iconButton} aria-label={count > 0 ? `Carrito: ${count} productos` : "Carrito"}>
              <ShoppingCart className="h-7 w-7" strokeWidth={2.4} aria-hidden />
              {count > 0 && <span key={count} className="st-pop absolute right-1 top-1.5 h-3 w-3 rounded-full bg-st-header-fg" aria-hidden />}
            </Link>
            {theme.showSearch && (
              <button type="button" className={iconButton} onClick={() => setSearchOpen(true)} aria-label="Buscar productos">
                <Search className="h-7 w-7" strokeWidth={2.6} aria-hidden />
              </button>
            )}
          </div>
        </div>
      </header>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} store={store} />
      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
      {!focused && <CartBar />}
      {store.whatsappUrl && <WhatsAppButton href={store.whatsappUrl} hidden={menuOpen} focused={focused} withCartBar={ready && count > 0} />}
      {!focused && <BottomNav onSearch={theme.showSearch ? () => setSearchOpen(true) : undefined} />}
    </>
  )
}

// ───────────── Menú lateral ─────────────

function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])
}

function SideMenu({ open, onClose, store }: { open: boolean; onClose: () => void; store: StoreInfo }) {
  useOverlay(open, onClose)
  const item = "flex items-center gap-4 rounded-lg px-3 py-3 text-lg font-semibold transition hover:bg-white/10 st-focus"
  const external = [
    { href: store.whatsappUrl, label: "WhatsApp", Icon: MessageCircle },
    { href: store.instagramUrl, label: "Instagram", Icon: Instagram },
    { href: store.facebookUrl, label: "Facebook", Icon: Facebook },
    { href: store.websiteUrl, label: "Sitio web", Icon: Globe },
  ].filter((link) => link.href)

  return (
    <div className={cn("fixed inset-0 z-50", !open && "pointer-events-none")} aria-hidden={!open}>
      <div className={cn("absolute inset-0 bg-black/50 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        // `inert` saca del orden de tabulación los enlaces del menú cerrado.
        inert={!open}
        className={cn("absolute inset-y-0 left-0 flex w-4/5 max-w-xs flex-col bg-st-nav text-st-nav-fg shadow-2xl transition-transform duration-300 ease-out", open ? "translate-x-0" : "-translate-x-full")}
      >
        <div className="flex h-16 items-center justify-between px-3">
          <button type="button" className={iconButton} onClick={onClose} aria-label="Cerrar menú">
            <X className="h-7 w-7" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-6">
          <Link href="/" className={item}>
            <Home className="h-6 w-6" aria-hidden /> Inicio
          </Link>
          <Link href="/contacto" className={item}>
            <Info className="h-6 w-6" aria-hidden /> Información
          </Link>
          {external.map(({ href, label, Icon }) => (
            <a key={label} href={href!} target="_blank" rel="noopener noreferrer" className={item}>
              <Icon className="h-6 w-6" aria-hidden /> {label}
            </a>
          ))}

          <div className="my-3 h-px bg-white/20" aria-hidden />
          <Link href="/backoffice" className={item}>
            <Lock className="h-6 w-6" aria-hidden /> Admin
          </Link>

        </nav>

        <a
          href="https://www.autogestiva.com.ar"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-[#102547] px-6 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-center text-base font-bold text-white transition hover:brightness-110 st-focus"
        >
          ¡Quiero una tienda así para mi negocio!
        </a>
      </aside>
    </div>
  )
}

// ───────────── Buscador ─────────────

interface SearchResult {
  id: string
  category_id: string
  title: string
  subtitle: string
  image_url: string
  price: number
  discount?: number
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  useOverlay(true, onClose)
  const placeholder = useStoreText("searchPlaceholder", "Buscar productos")
  const [text, setText] = useState("")
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => input.current?.focus(), [])

  // Busca mientras se escribe, esperando una pausa y descartando respuestas viejas.
  useEffect(() => {
    const term = text.trim()
    if (term.length < 2) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        setResults(response.ok ? await response.json() : [])
        setLoading(false)
      } catch {
        if (!controller.signal.aborted) {
          setResults([])
          setLoading(false)
        }
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [text])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-st-bg text-st-text md:items-center md:bg-black/50 md:p-6 md:pt-20" role="dialog" aria-modal="true" aria-label="Buscar productos" onClick={onClose}>
      <div className="flex min-h-0 w-full flex-1 flex-col bg-st-bg md:max-h-[70vh] md:max-w-xl md:flex-none md:rounded-st md:shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-st-border p-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-st-muted" aria-hidden />
            <input ref={input} type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder={`${placeholder}…`} className="st-input pl-10" aria-label={placeholder} />
          </div>
          <button type="button" className="rounded px-2 py-2 text-sm font-bold text-st-primary st-focus" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3" aria-live="polite">
          {loading && (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-st-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Buscando…
            </p>
          )}
          {!loading && results === null && <p className="py-10 text-center text-sm text-st-muted">Escribí al menos 2 letras para buscar.</p>}
          {!loading && results?.length === 0 && <p className="py-10 text-center text-sm text-st-muted">No encontramos productos para “{text.trim()}”.</p>}
          {!loading && results && results.length > 0 && (
            <ul className="space-y-2">
              {results.map((product) => (
                <li key={product.id}>
                  <Link href={productHref(product)} className="st-raised flex items-center gap-3 overflow-hidden transition hover:brightness-[0.98] st-focus">
                    <span className="relative h-16 w-14 shrink-0 bg-st-text/5">
                      <StoreImage src={product.image_url} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1 py-2">
                      <span className="block truncate font-bold text-st-heading">{product.title}</span>
                      {product.subtitle && <span className="block truncate text-xs text-st-muted">{product.subtitle}</span>}
                    </span>
                    <span className="shrink-0 pr-3 font-black text-st-price">{formatPrice(unitPrice(product.price, product.discount))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ───────────── Barra «Ver mi pedido» ─────────────

function CartBar() {
  const { count, subtotal, ready } = useCart()
  const label = useStoreText("viewCart", "Ver mi pedido")
  if (!ready || count === 0) return null

  return (
    <Link href="/carrito" className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 bg-st-secondary text-st-secondary-fg shadow-[0_-3px_12px_rgba(0,0,0,0.12)] st-focus md:bottom-0 md:pb-[env(safe-area-inset-bottom)]">
      <span className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 text-lg font-bold">
        <span>{label}</span>
        <span className="text-xl font-black">{formatPrice(subtotal)}</span>
      </span>
    </Link>
  )
}

// ───────────── Botón flotante de WhatsApp ─────────────

function WhatsAppButton({ href, hidden, focused, withCartBar }: { href: string; hidden: boolean; focused: boolean; withCartBar: boolean }) {
  // Se apoya encima de lo que haya fijo al pie: menú inferior (celular) y barra "Ver mi pedido",
  // o la barra de acción de las pantallas de producto, carrito y pedido.
  const bottom = focused
    ? "bottom-[calc(6rem+env(safe-area-inset-bottom))]"
    : withCartBar
      ? "bottom-[calc(8.5rem+env(safe-area-inset-bottom))] md:bottom-[calc(5rem+env(safe-area-inset-bottom))]"
      : "bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6"

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      tabIndex={hidden ? -1 : undefined}
      className={cn(
        "fixed right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition duration-200 hover:scale-105 hover:brightness-105 st-focus",
        bottom,
        hidden && "pointer-events-none scale-75 opacity-0",
      )}
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="currentColor" aria-hidden>
        <path d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.55 4.19 1.6 6.02L4 28l7.13-1.87a12 12 0 0 0 4.9 1.04h.01C22.68 27.17 28 21.77 28 15.13 28 11.92 26.75 8.9 24.5 6.64A11.9 11.9 0 0 0 16.04 3Zm0 21.97h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.76.99 1-3.66-.24-.38a9.9 9.9 0 0 1-1.52-5.29c0-5.48 4.46-9.94 9.95-9.94 2.65 0 5.15 1.04 7.02 2.92a9.86 9.86 0 0 1 2.9 7.03c0 5.48-4.46 9.94-9.94 9.94Zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    </a>
  )
}

// ───────────── Menú inferior (celular): carrito y buscador ─────────────

function BottomNav({ onSearch }: { onSearch?: () => void }) {
  const { count } = useCart()
  const item = "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-bold transition active:bg-white/10 st-focus"

  return (
    <nav aria-label="Acceso rápido" className="fixed inset-x-0 bottom-0 z-20 bg-st-primary pb-[env(safe-area-inset-bottom)] text-st-primary-fg md:hidden">
      <div className="mx-auto flex h-16 max-w-md items-stretch">
        <Link href="/carrito" className={item}>
          <span className="relative">
            <ShoppingCart className="h-7 w-7" strokeWidth={2.4} aria-hidden />
            {count > 0 && (
              <span key={count} className="st-pop absolute -right-2.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-st-primary-fg px-1 text-[11px] font-black text-st-primary">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </span>
          Carrito
        </Link>
        {onSearch && (
          <button type="button" onClick={onSearch} className={item}>
            <Search className="h-7 w-7" strokeWidth={2.6} aria-hidden />
            Buscar
          </button>
        )}
      </div>
    </nav>
  )
}
