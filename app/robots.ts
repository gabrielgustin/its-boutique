import type { MetadataRoute } from "next"

export const dynamic = "force-dynamic"

const base = () => process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/backoffice", "/api/", "/carrito", "/finalizar-pedido", "/pedido/"] }],
    ...(base() && { sitemap: `${base()}/sitemap.xml` }),
  }
}
