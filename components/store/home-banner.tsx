"use client"

import { useEffect, useState } from "react"
import { ClosedBanner, PromoBanner } from "@/components/store/banners"
import { PREVIEW_READY } from "@/components/site-theme"

export const BANNER_PREVIEW_MESSAGE = "its-banner-preview"

interface BannerDraft {
  enabled: boolean
  text: string | null
}

// Aviso de la portada. Dentro de la vista previa del backoffice recibe el borrador en vivo
// y lo muestra aunque la tienda esté cerrada; en una visita normal usa lo guardado.
export function HomeBanner({ banner, status }: { banner: BannerDraft; status: { open: boolean; canOrder: boolean } }) {
  const [draft, setDraft] = useState<BannerDraft | null>(null)

  useEffect(() => {
    // Solo dentro de un iframe del mismo sitio: una visita normal nunca acepta cambios desde afuera.
    if (window.parent === window) return
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      if (event.data?.type !== BANNER_PREVIEW_MESSAGE) return
      setDraft({ enabled: Boolean(event.data.enabled), text: String(event.data.text ?? "").slice(0, 150) })
    }
    window.addEventListener("message", onMessage)
    window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  const shown = draft ?? (status.open ? banner : null)
  if (shown) return shown.enabled && shown.text ? <PromoBanner key={shown.text} text={shown.text} /> : null
  return <ClosedBanner canOrder={status.canOrder} />
}
