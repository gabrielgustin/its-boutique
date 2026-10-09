import "server-only"
import { revalidateTag, unstable_cache } from "next/cache"
import { query, sql } from "@/lib/sql"
import { isOpenAt, type BusinessHours } from "@/lib/hours"
import { DEFAULT_THEME, sanitizeTheme, type ThemeSettings } from "@/lib/theme"

export { isOpenAt, type BusinessHours }

// Lecturas públicas de la tienda (catálogo y configuración).
// Se guardan en caché y se invalidan cuando el backoffice modifica algo.

export type CacheTag = "catalog" | "config"

// Toda escritura desde el backoffice invalida la caché al instante (ver `invalidate`), así que el
// vencimiento por tiempo es solo una red de seguridad. Mantenerlo largo es lo que permite que la base
// de datos se apague: con un vencimiento corto, cada pocos minutos la tienda la volvería a despertar.
const CACHE_SECONDS = 60 * 60 * 24

const cached = <Args extends unknown[], T>(key: string, tag: CacheTag, fn: (...args: Args) => Promise<T>) =>
  unstable_cache(fn, [key], { tags: [tag], revalidate: CACHE_SECONDS })

/** Llamar después de cualquier escritura para que la tienda muestre los datos nuevos al instante. */
export function invalidate(...tags: CacheTag[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
}

// ───────────── Tipos ─────────────

export interface Category {
  id: string
  title: string
  subtitle: string
  image_url: string
  max_discount?: number
  product_count?: number
}

export interface ProductVariant {
  id: string
  name: string
  price: number
}

export interface Product {
  id: string
  category_id: string
  title: string
  subtitle: string
  subcategoria_id?: string
  image_url: string
  /** Foto principal seguida de las fotos extra. */
  images: string[]
  description: string
  price: number
  is_promo: boolean
  discount?: number
  variants?: ProductVariant[]
}

export interface Subcategoria {
  id: string
  nombre: string
  categoria_id: string
}


// ───────────── Utilidades ─────────────

const placeholder = (title: string, size: number) => `/placeholder.svg?height=${size}&width=${size}&query=${encodeURIComponent(title)}`

function imageUrl(url: string | null | undefined, fallback: string): string {
  if (!url || url.startsWith("data:")) return fallback
  return url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://") ? url : fallback
}

function toProduct(row: any): Product {
  const image = imageUrl(row.imagen, placeholder(row.nombre, 600))
  const discount = Number(row.descuento) || 0
  return {
    id: row.id,
    category_id: row.categoria,
    title: row.nombre,
    subtitle: row.subcategoria_nombre || "",
    subcategoria_id: row.subcategoria || "",
    image_url: image,
    images: [image],
    description: row.descripcion || "",
    price: Number(row.precio) || 0,
    is_promo: discount > 0,
    discount: discount > 0 ? discount : undefined,
  }
}

// ───────────── Catálogo ─────────────

export const getCategories = cached("categories", "catalog", async (): Promise<Category[]> => {
  const rows = await sql`
    SELECT c.id, c.nombre, c.imagen,
           MAX(p.descuento) AS max_discount,
           COUNT(p.id) AS product_count
    FROM categorias c
    LEFT JOIN productos p ON p.categoria = c.id AND p.visible
    WHERE c.visible
    GROUP BY c.id
    ORDER BY c.orden ASC NULLS LAST, c.created_at ASC
  `
  return rows.map((row) => ({
    id: row.id,
    title: row.nombre,
    subtitle: "",
    image_url: imageUrl(row.imagen, placeholder(row.nombre, 600)),
    max_discount: Number(row.max_discount) > 0 ? Number(row.max_discount) : undefined,
    product_count: Number(row.product_count) || 0,
  }))
})

export async function getCategoryById(id: string): Promise<Category | null> {
  return (await getCategories()).find((category) => category.id === id) ?? null
}

export const getProducts = cached("products", "catalog", async (): Promise<Product[]> => {
  const rows = await query(
    `SELECT p.*, s.nombre AS subcategoria_nombre
     FROM productos p
     LEFT JOIN subcategorias s ON s.id = p.subcategoria
     WHERE p.visible
     ORDER BY p.categoria ASC, p.orden ASC NULLS LAST, p.created_at ASC`,
  )
  return rows.map(toProduct)
})

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  return (await getProducts()).filter((product) => product.category_id === categoryId)
}

export const getProductById = cached("product", "catalog", async (id: string): Promise<Product | null> => {
  const [row] = await query(
    `SELECT p.*, s.nombre AS subcategoria_nombre
     FROM productos p
     LEFT JOIN subcategorias s ON s.id = p.subcategoria
     WHERE p.id = $1 AND p.visible`,
    [id],
  )
  if (!row) return null

  const [variants, images] = await Promise.all([
    sql`SELECT id, nombre, precio FROM producto_variantes WHERE producto_id = ${id} ORDER BY orden ASC`,
    sql`SELECT url FROM producto_imagenes WHERE producto_id = ${id} ORDER BY orden ASC, created_at ASC`,
  ])

  const product = toProduct(row)
  return {
    ...product,
    images: [product.image_url, ...images.map((image) => imageUrl(image.url, "")).filter(Boolean)],
    variants: variants.map((variant) => ({
      id: variant.id,
      name: variant.nombre,
      price: Number(variant.precio) || 0,
    })),
  }
})

export const getSubcategoriesByCategory = cached("subcategories", "catalog", async (categoryId: string): Promise<Subcategoria[]> => {
  const rows = await sql`SELECT id, nombre, categoria_id FROM subcategorias WHERE categoria_id = ${categoryId} ORDER BY nombre ASC`
  return rows as Subcategoria[]
})

export async function searchProducts(text: string): Promise<Product[]> {
  const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const words = normalize(text).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  return (await getProducts())
    .filter((product) => {
      const haystack = normalize(`${product.title} ${product.description} ${product.subtitle}`)
      return words.every((word) => haystack.includes(word))
    })
    .slice(0, 50)
}

// ───────────── Configuración ─────────────

const getConfigMap = cached("site-config", "config", async (): Promise<Record<string, string>> => {
  const rows = await sql`SELECT config_key, config_value FROM site_config`
  return Object.fromEntries(rows.map((row) => [row.config_key, row.config_value ?? ""]))
})

// Lo único de site_config que puede salir al navegador.
const PUBLIC_CONFIG_KEYS = [
  "site_name",
  "store_logo",
  "header_logo_url",
  "instagram_url",
  "facebook_url",
  "website_url",
  "contact_whatsapp",
  "store_location",
  "store_location_lat",
  "store_location_lng",
  "banner_text",
  "banner_enabled",
  "qr_store_url",
] as const

export type PublicConfig = Partial<Record<(typeof PUBLIC_CONFIG_KEYS)[number], string>>

export async function getPublicConfig(): Promise<PublicConfig> {
  const config = await getConfigMap()
  return Object.fromEntries(PUBLIC_CONFIG_KEYS.filter((key) => config[key]).map((key) => [key, config[key]]))
}

export async function getSiteConfig(key: (typeof PUBLIC_CONFIG_KEYS)[number]): Promise<string | null> {
  return (await getConfigMap())[key] || null
}

export async function getPromoBannerConfig(): Promise<{ text: string | null; enabled: boolean }> {
  const config = await getConfigMap()
  const text = config.banner_text || null
  return { text, enabled: config.banner_enabled === "true" && Boolean(text) }
}

/** El diseño de "Personaliza tu App", guardado como JSON en site_config. */
export async function getTheme(): Promise<ThemeSettings> {
  const raw = (await getConfigMap()).theme
  if (!raw) return { ...DEFAULT_THEME }
  try {
    return sanitizeTheme(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_THEME }
  }
}

export async function saveTheme(input: unknown): Promise<ThemeSettings> {
  const theme = sanitizeTheme(input)
  await sql`
    INSERT INTO site_config (config_key, config_value, description)
    VALUES ('theme', ${JSON.stringify(theme)}, 'Diseño de la tienda (Personaliza tu App)')
    ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = NOW()
  `
  invalidate("config")
  return theme
}

// ───────────── Horarios ─────────────

const DAY_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]

export const getBusinessHours = cached("business-hours", "config", async (): Promise<BusinessHours[]> => {
  const rows = await sql`
    SELECT id, day_of_week, open_time, close_time, additional_open_time, additional_close_time, is_open
    FROM business_hours
  `
  const index = (day: string) => DAY_ORDER.indexOf(day.toLowerCase())
  return (rows as BusinessHours[]).sort((a, b) => index(a.day_of_week) - index(b.day_of_week))
})

const getAllowOrdersWhenClosed = cached("orders-when-closed", "config", async (): Promise<boolean> => {
  const [row] = await sql`SELECT allow_orders_when_closed FROM business_hours_config ORDER BY id DESC LIMIT 1`
  return row?.allow_orders_when_closed === true
})

export async function isBusinessOpen(): Promise<boolean> {
  return isOpenAt(await getBusinessHours(), new Date())
}

/** Se puede comprar si el local está abierto o si se aceptan pedidos fuera de horario. */
export async function canOrderNow(): Promise<{ open: boolean; canOrder: boolean }> {
  const [open, allowClosed] = await Promise.all([isBusinessOpen(), getAllowOrdersWhenClosed()])
  return { open, canOrder: open || allowClosed }
}

// ───────────── Opciones del checkout ─────────────

export interface CheckoutOptions {
  deliveryMethods: { id: number; name: string; cost: number; is_default: boolean }[]
  paymentMethods: { id: number; name: string; is_default: boolean }[]
}

export const getCheckoutOptions = cached("checkout-options", "config", async (): Promise<CheckoutOptions> => {
  const [delivery, payment] = await Promise.all([
    sql`SELECT id, name, delivery_cost, is_default FROM delivery_methods WHERE is_active ORDER BY is_default DESC, id ASC`,
    sql`SELECT id, name, is_default FROM payment_methods WHERE is_active ORDER BY is_default DESC, id ASC`,
  ])
  return {
    deliveryMethods: delivery.map((row) => ({ id: row.id, name: row.name, cost: Math.round(Number(row.delivery_cost) || 0), is_default: row.is_default })),
    paymentMethods: payment.map((row) => ({ id: row.id, name: row.name, is_default: row.is_default })),
  }
})

/** Datos de la tienda que usan el encabezado, el menú y las páginas de contacto. */
export async function getStoreInfo() {
  const config = await getPublicConfig()
  const whatsapp = config.contact_whatsapp?.replace(/[^\d]/g, "") || null
  return {
    siteName: config.site_name || "ITS Boutique",
    logoUrl: config.store_logo || config.header_logo_url || null,
    instagramUrl: config.instagram_url || null,
    facebookUrl: config.facebook_url || null,
    websiteUrl: config.website_url || null,
    whatsapp,
    whatsappUrl: whatsapp ? `https://wa.me/${whatsapp}` : null,
    address: config.store_location || null,
    mapUrl: config.store_location
      ? config.store_location_lat && config.store_location_lng
        ? `https://www.google.com/maps/search/?api=1&query=${config.store_location_lat},${config.store_location_lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.store_location)}`
      : null,
  }
}
