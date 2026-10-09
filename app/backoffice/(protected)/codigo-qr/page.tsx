import { headers } from "next/headers"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { QrPanel } from "@/components/backoffice/qr-panel"
import { getStoreInfo, getTheme } from "@/lib/db"
import { DEFAULT_LOGO_URL } from "@/lib/theme"

export default async function CodigoQRPage() {
  const [store, theme, requestHeaders] = await Promise.all([getStoreInfo(), getTheme(), headers()])
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000"
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  // El QR apunta a la dirección oficial de la tienda; si no está configurada, a la que se está usando ahora.
  const url = (process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`).replace(/\/$/, "")
  const logoUrl = theme.logoUrl ?? store.logoUrl ?? DEFAULT_LOGO_URL

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <header className="sticky top-0 z-30 bg-[#1e4b8e] text-white print:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 md:px-6">
          <Link href="/backoffice" aria-label="Volver al panel" className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="title-font truncate text-2xl leading-tight md:text-3xl">Código QR</h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8 print:max-w-none print:p-0">
        <QrPanel url={url} logoUrl={logoUrl} storeName={store.siteName} />
      </main>
    </div>
  )
}
