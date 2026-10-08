import type { MetadataRoute } from "next"
import { getCategories, getProducts } from "@/lib/db"

// Se renueva cada 5 minutos con los productos publicados.
export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
  if (!base) return []
  const [categories, products] = await Promise.all([getCategories(), getProducts()])
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/contacto`, changeFrequency: "monthly", priority: 0.3 },
    ...categories.map((category) => ({ url: `${base}/productos/${category.id}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((product) => ({ url: `${base}/productos/${product.category_id}/${product.id}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ]
}
