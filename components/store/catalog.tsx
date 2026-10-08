"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { StoreImage } from "@/components/store/store-image"
import { PageBody, TitleBar } from "@/components/store/title-bar"
import { useSiteTheme } from "@/components/site-theme"
import { formatPrice, unitPrice } from "@/lib/pricing"
import { cn } from "@/lib/utils"

export interface CatalogCategory {
  id: string
  title: string
  image_url: string
  max_discount?: number
  product_count?: number
}

export interface CatalogProduct {
  id: string
  category_id: string
  title: string
  subtitle: string
  subcategoria_id?: string
  image_url: string
  price: number
  discount?: number
}

const textShadow = { textShadow: "0 2px 8px rgba(0,0,0,0.6)" }

// ───────────── Categorías ─────────────

export function CategoryGrid({ categories }: { categories: CatalogCategory[] }) {
  const { categoryLayout, showDiscountBadge } = useSiteTheme()

  if (categories.length === 0) {
    return <p className="st-raised px-4 py-12 text-center text-st-muted">Todavía no hay categorías para mostrar.</p>
  }

  if (categoryLayout === "tiles") {
    return (
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {categories.map((category, index) => (
          <li key={category.id}>
            <Link href={`/productos/${category.id}`} className="group relative block overflow-hidden rounded-st bg-st-text/5 st-focus" style={{ aspectRatio: "var(--st-image-ratio)" }}>
              <StoreImage src={category.image_url} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" priority={index < 4} className="object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
              {showDiscountBadge && category.max_discount ? <span className="st-off absolute left-2 top-2">Hasta {Math.round(category.max_discount)}% OFF</span> : null}
              <span className="absolute inset-x-0 bottom-0 p-3 text-lg font-extrabold leading-tight text-white md:text-xl" style={textShadow}>
                {category.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category, index) => (
        <li key={category.id}>
          <Link href={`/productos/${category.id}`} className="group relative flex h-36 flex-col items-center justify-center gap-2 overflow-hidden rounded-st bg-st-text/10 px-4 text-center shadow-[var(--st-shadow)] md:h-40 st-focus">
            <StoreImage src={category.image_url} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" priority={index < 3} className="object-cover transition duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-black/35" aria-hidden />
            <span className="relative max-w-full text-balance text-2xl font-extrabold leading-tight text-white md:text-[1.7rem]" style={textShadow}>
              {category.title}
            </span>
            {showDiscountBadge && category.max_discount ? <span className="st-off relative shadow-sm">Hasta {Math.round(category.max_discount)}% OFF</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}

// ───────────── Productos ─────────────

export function Price({ price, discount, className }: { price: number; discount?: number; className?: string }) {
  const final = unitPrice(price, discount)
  return (
    <span className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className="font-black text-st-price">{formatPrice(final)}</span>
      {final < price && <span className="text-[0.75em] font-medium text-st-muted line-through">{formatPrice(price)}</span>}
    </span>
  )
}

export function ProductGrid({ products, priority = false }: { products: CatalogProduct[]; priority?: boolean }) {
  const { productLayout } = useSiteTheme()

  if (productLayout === "grid") {
    return (
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
        {products.map((product, index) => (
          <li key={product.id}>
            <Link href={`/productos/${product.category_id}/${product.id}`} className="group block rounded-st st-focus">
              <span className="relative block overflow-hidden rounded-st bg-st-text/5 shadow-[var(--st-shadow)]" style={{ aspectRatio: "var(--st-image-ratio)" }}>
                <StoreImage
                  src={product.image_url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  priority={priority && index < 4}
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-2 top-2 flex flex-col items-start gap-1">
                  {product.discount ? <span className="st-off">-{Math.round(product.discount)}%</span> : null}
                </span>
              </span>
              <span className="mt-2.5 block px-0.5">
                <span className="line-clamp-2 text-[15px] font-bold leading-snug text-st-heading md:text-base">{product.title}</span>
                <Price price={product.price} discount={product.discount} className="mt-1 text-lg" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductRow product={product} />
        </li>
      ))}
    </ul>
  )
}

/** Tarjeta de producto: foto a un costado, nombre, precio y descuento. */
function ProductRow({ product }: { product: CatalogProduct }) {
  return (
    <Link href={`/productos/${product.category_id}/${product.id}`} className="st-raised group relative flex h-36 overflow-hidden transition hover:brightness-[0.98] st-focus">
      <span className="relative w-[7.2rem] shrink-0 border-r border-st-border bg-white">
        <StoreImage src={product.image_url} alt="" fill sizes="116px" className="object-cover" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-4 py-3">
        <span className="truncate text-[1.05rem] font-bold text-st-heading md:text-lg">{product.title}</span>
        <Price price={product.price} discount={product.discount} className="text-xl" />
        {product.discount ? (
          <span className="st-off self-start">Hasta {Math.round(product.discount)}% OFF</span>
        ) : product.subtitle ? (
          <span className="truncate text-sm text-st-muted">{product.subtitle}</span>
        ) : null}
      </span>
    </Link>
  )
}

// ───────────── Listado de una categoría: filtros + orden ─────────────

type Sort = "default" | "price-asc" | "price-desc" | "discount"

const SORTS: { value: Sort; label: string }[] = [
  { value: "default", label: "Destacados" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
  { value: "discount", label: "Mayor descuento" },
]

export function CategoryProducts({ title, products, subcategories }: { title: string; products: CatalogProduct[]; subcategories: { id: string; nombre: string }[] }) {
  const [subcategory, setSubcategory] = useState("todos")
  const [sort, setSort] = useState<Sort>("default")

  // Solo se ofrecen las subcategorías que tienen productos.
  const chips = useMemo(() => subcategories.filter((entry) => products.some((product) => product.subcategoria_id === entry.id)), [products, subcategories])

  const visible = useMemo(() => {
    const list = subcategory === "todos" ? [...products] : products.filter((product) => product.subcategoria_id === subcategory)
    const final = (product: CatalogProduct) => unitPrice(product.price, product.discount)
    if (sort === "price-asc") list.sort((a, b) => final(a) - final(b))
    if (sort === "price-desc") list.sort((a, b) => final(b) - final(a))
    if (sort === "discount") list.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))
    return list
  }, [products, subcategory, sort])

  const chip = (active: boolean) =>
    cn(
      "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition st-focus",
      active ? "border-st-primary bg-st-primary text-st-primary-fg" : "border-st-border bg-st-card text-st-text hover:border-st-primary",
    )

  return (
    <>
      <TitleBar title={title} backHref="/" share />

      {/* Filtros: se deslizan de costado y quedan fijos al bajar. */}
      {(chips.length > 0 || products.length > 1) && (
        <div className="sticky top-16 z-10 border-b border-st-border bg-st-header text-st-header-fg">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            {chips.length > 0 ? (
              <div className="-mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 scrollbar-hide" role="group" aria-label="Filtrar por tipo">
                <button type="button" className={chip(subcategory === "todos")} aria-pressed={subcategory === "todos"} onClick={() => setSubcategory("todos")}>
                  Todos
                </button>
                {chips.map((entry) => (
                  <button key={entry.id} type="button" className={chip(subcategory === entry.id)} aria-pressed={subcategory === entry.id} onClick={() => setSubcategory(entry.id)}>
                    {entry.nombre}
                  </button>
                ))}
              </div>
            ) : (
              <span className="flex-1" />
            )}
            <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="Ordenar productos" className="hidden shrink-0 rounded-st-btn border border-st-border bg-st-card px-2.5 py-2 text-sm font-bold text-st-text st-focus md:block">
              {SORTS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <PageBody>
        {visible.length === 0 ? <p className="st-raised px-4 py-12 text-center text-st-muted">No hay productos para mostrar en esta sección.</p> : <ProductGrid products={visible} priority />}
      </PageBody>
    </>
  )
}
