"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, X, ZoomIn } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/components/store/cart"
import { StoreImage } from "@/components/store/store-image"
import { useStoreText } from "@/components/site-theme"
import { NO_CATEGORY } from "@/lib/catalog-links"
import { formatPrice, unitPrice } from "@/lib/pricing"
import { cn } from "@/lib/utils"

interface Variant {
  id: string
  name: string
  price: number
}

export interface DetailProduct {
  id: string
  category_id: string
  title: string
  subtitle: string
  description: string
  images: string[]
  price: number
  discount?: number
  variants?: Variant[]
}

const NOTE_LIMIT = 150

export function ProductDetail({ product, category, canOrder }: { product: DetailProduct; category: { id: string; title: string }; canOrder: boolean }) {
  const router = useRouter()
  const { add } = useCart()
  const addLabel = useStoreText("addToCart", "Agregar")
  const variants = product.variants ?? []
  const hasVariants = variants.length > 0

  // Si hay una sola opción, viene elegida.
  const [variantId, setVariantId] = useState<string | null>(variants.length === 1 ? variants[0].id : null)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState("")
  const [missingVariant, setMissingVariant] = useState(false)
  const [zoom, setZoom] = useState<string | null>(null)
  const variantGroup = useRef<HTMLDivElement>(null)

  const variant = variants.find((entry) => entry.id === variantId) ?? null
  const basePrice = variant?.price ?? product.price
  const price = unitPrice(basePrice, product.discount)
  const disabled = !canOrder

  // Si las variantes tienen precios distintos, se avisa "desde" hasta que se elige una.
  const fromPrice = useMemo(() => {
    if (variant || !hasVariants) return null
    const prices = [...new Set(variants.map((entry) => entry.price))]
    return prices.length > 1 ? unitPrice(Math.min(...prices), product.discount) : null
  }, [variant, hasVariants, variants, product.discount])

  function handleAdd() {
    if (hasVariants && !variant) {
      setMissingVariant(true)
      variantGroup.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    add({
      key: variant ? `${product.id}:${variant.id}` : product.id,
      productId: product.id,
      variantId: variant?.id,
      categoryId: category.id,
      categoryTitle: category.title,
      title: product.title,
      variantName: variant?.name,
      price,
      listPrice: basePrice,
      quantity,
      imageUrl: product.images[0],
      note: note.trim() || undefined,
    })
    toast.success("Agregado al pedido", { description: `${quantity} × ${product.title}${variant ? ` (${variant.name})` : ""}` })
    router.push(category.id === NO_CATEGORY ? "/" : `/productos/${category.id}`)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-10">
      <Gallery images={product.images} title={product.title} onZoom={setZoom} />

      <div>
        {/* Precio */}
        <div className="border-b border-st-border pb-4">
          {product.discount && fromPrice === null ? <p className="text-sm text-st-muted line-through">{formatPrice(basePrice)}</p> : null}
          <p className="text-3xl font-black text-st-price">
            {fromPrice !== null && <span className="mr-1.5 text-base font-bold text-st-muted">Desde</span>}
            {formatPrice(fromPrice ?? price)}
          </p>
          {product.discount ? <span className="st-off mt-2">{Math.round(product.discount)}% OFF</span> : null}
        </div>

        {product.description && <p className="whitespace-pre-line border-b border-st-border py-4 text-[15px] leading-relaxed text-st-text">{product.description}</p>}

        {hasVariants && (
          <div ref={variantGroup} className="border-b border-st-border py-4">
            <p className="mb-2 font-bold text-st-heading">
              Elegí una opción
              {variant && <span className="ml-2 font-normal text-st-muted">{variant.name}</span>}
            </p>
            <div role="radiogroup" aria-label="Opciones del producto" className="flex flex-wrap gap-2">
              {variants.map((entry) => {
                const active = entry.id === variantId
                return (
                  <button
                    key={entry.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setVariantId(entry.id)
                      setMissingVariant(false)
                    }}
                    className={cn(
                      "min-w-12 rounded-st-btn border px-4 py-2.5 text-sm font-bold transition st-focus",
                      active ? "border-st-primary bg-st-primary text-st-primary-fg" : "border-st-border bg-st-card text-st-text hover:border-st-primary",
                    )}
                  >
                    {entry.name}
                  </button>
                )
              })}
            </div>
            {missingVariant && (
              <p role="alert" className="mt-2 text-sm font-semibold text-red-600">
                Elegí una opción para continuar.
              </p>
            )}
          </div>
        )}

        {!disabled && (
          <div className="py-4">
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="observacion" className="font-bold text-st-heading">
                Observaciones
              </label>
              <span className="text-sm text-st-muted tabular-nums">
                {note.length} / {NOTE_LIMIT}
              </span>
            </div>
            <textarea id="observacion" value={note} onChange={(event) => setNote(event.target.value.slice(0, NOTE_LIMIT))} rows={3} placeholder="Si querés, ingresá una observación para que la tengan en cuenta en tu pedido (máximo 150 caracteres)." className="st-input resize-none bg-st-text/5" />
          </div>
        )}
      </div>

      {/* Barra de compra: fija al pie en el celular, en su lugar en pantallas anchas. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-st-border bg-st-card px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-3px_12px_rgba(0,0,0,0.1)] md:static md:col-start-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        {!canOrder ? (
          <p className="mx-auto max-w-xl rounded-st-btn bg-st-text/5 py-3.5 text-center text-sm font-bold text-st-muted">El local está cerrado: no se toman pedidos ahora</p>
        ) : (
          <div className="mx-auto flex max-w-xl items-center gap-3 md:mx-0">
            <div className="flex shrink-0 items-center gap-2" role="group" aria-label="Cantidad">
              <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={quantity <= 1} aria-label="Quitar uno" className="flex h-11 w-11 items-center justify-center rounded-lg bg-st-primary/15 text-st-primary transition disabled:opacity-40 st-focus">
                <Minus className="h-6 w-6" strokeWidth={3} aria-hidden />
              </button>
              <span className="w-8 text-center text-xl font-black tabular-nums" aria-live="polite">
                {quantity}
              </span>
              <button type="button" onClick={() => setQuantity((current) => Math.min(99, current + 1))} disabled={quantity >= 99} aria-label="Agregar uno" className="flex h-11 w-11 items-center justify-center rounded-lg bg-st-primary text-st-primary-fg transition disabled:opacity-40 st-focus">
                <Plus className="h-6 w-6" strokeWidth={3} aria-hidden />
              </button>
            </div>
            <button type="button" onClick={handleAdd} className="flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-between gap-3 rounded-lg bg-st-button px-4 text-st-button-fg transition hover:brightness-110 active:scale-[0.99] st-focus">
              <span className="text-lg font-bold">{addLabel}</span>
              <span className="text-right leading-tight">
                {product.discount ? <span className="block text-xs line-through opacity-70">{formatPrice(basePrice * quantity)}</span> : null}
                <span className="block text-xl font-black">{formatPrice(price * quantity)}</span>
              </span>
            </button>
          </div>
        )}
      </div>

      {zoom && <Lightbox src={zoom} title={product.title} onClose={() => setZoom(null)} />}
    </div>
  )
}

/** Foto del producto, con carrusel si hay más de una y botón de lupa. */
function Gallery({ images, title, onZoom }: { images: string[]; title: string; onZoom: (src: string) => void }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  return (
    <div className="-mx-4 md:mx-0">
      <div className="relative bg-white md:rounded-st md:shadow-[var(--st-shadow)]">
        <div ref={track} onScroll={(event) => setIndex(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide md:rounded-st" aria-roledescription="carrusel" aria-label={`Fotos de ${title}`}>
          {images.map((src, position) => (
            <div key={`${src}-${position}`} className="relative h-[22rem] w-full shrink-0 snap-center md:h-[30rem]">
              <StoreImage src={src} alt={position === 0 ? title : `${title}: foto ${position + 1}`} fill priority={position === 0} sizes="(min-width: 768px) 50vw, 100vw" className="object-contain" />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onZoom(images[index] ?? images[0])} aria-label="Ampliar foto" className="absolute bottom-3 right-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-st-heading shadow-lg transition hover:scale-105 st-focus">
          <ZoomIn className="h-6 w-6" aria-hidden />
        </button>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-hidden>
            {images.map((_, position) => (
              <span key={position} className={cn("h-1.5 rounded-full bg-st-heading shadow transition-all", position === index ? "w-5" : "w-1.5 opacity-30")} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Lightbox({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label={`Foto ampliada de ${title}`} onClick={onClose} onKeyDown={(event) => event.key === "Escape" && onClose()}>
      <button type="button" autoFocus onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black st-focus">
        <X className="h-6 w-6" aria-hidden />
      </button>
      <div className="relative h-full w-full max-w-3xl">
        <StoreImage src={src} alt={title} fill sizes="100vw" className="object-contain" />
      </div>
    </div>
  )
}
