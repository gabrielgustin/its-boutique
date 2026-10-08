import type React from "react"
import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import { CartProvider } from "@/components/store/cart"
import { StoreShell } from "@/components/store/store-shell"
import { SiteThemeProvider } from "@/components/site-theme"
import { getStoreInfo, getTheme } from "@/lib/db"
import { DEFAULT_LOGO_URL, DEFAULT_SITE_DESCRIPTION, resolveColor } from "@/lib/theme"

// Título, descripción, ícono e imagen para compartir salen de "Personaliza tu App".
export async function generateMetadata(): Promise<Metadata> {
  const [theme, store] = await Promise.all([getTheme(), getStoreInfo()])
  const siteName = theme.siteName ?? store.siteName
  const description = theme.siteDescription ?? DEFAULT_SITE_DESCRIPTION
  const base = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)

  return {
    ...(base && { metadataBase: new URL(base) }),
    title: { default: siteName, template: `%s · ${siteName}` },
    description,
    applicationName: siteName,
    icons: { icon: [{ url: theme.faviconUrl ?? DEFAULT_LOGO_URL }], apple: theme.faviconUrl ?? DEFAULT_LOGO_URL },
    openGraph: {
      title: siteName,
      description,
      siteName,
      type: "website",
      locale: "es_AR",
      ...(theme.shareImageUrl && { images: [{ url: theme.shareImageUrl, alt: siteName }] }),
    },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme()
  return { themeColor: resolveColor(theme, "headerBg"), width: "device-width", initialScale: 1, viewportFit: "cover" }
}

export default async function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [theme, store] = await Promise.all([getTheme(), getStoreInfo()])

  return (
    <div className="store">
      <SiteThemeProvider initial={theme}>
        <CartProvider>
          <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-st-card focus:px-4 focus:py-2 focus:shadow-lg">
            Ir al contenido
          </a>
          <StoreShell
            store={{ ...store, siteName: theme.siteName ?? store.siteName }}
          />
          <main id="contenido">{children}</main>
          <Toaster theme="light" position="top-center" richColors />
        </CartProvider>
      </SiteThemeProvider>
    </div>
  )
}
