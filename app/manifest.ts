import type { MetadataRoute } from "next"
import { getStoreInfo, getTheme } from "@/lib/db"
import { DEFAULT_SITE_DESCRIPTION, resolveColor } from "@/lib/theme"

// Se arma con datos de la base: no se genera durante el build.
export const dynamic = "force-dynamic"

// Permite instalar la tienda en la pantalla de inicio del celular (PWA).
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [theme, store] = await Promise.all([getTheme(), getStoreInfo()])
  const name = theme.siteName ?? store.siteName

  return {
    name,
    short_name: name.slice(0, 12),
    description: theme.siteDescription ?? DEFAULT_SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: resolveColor(theme, "pageBg"),
    theme_color: resolveColor(theme, "primary"),
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
