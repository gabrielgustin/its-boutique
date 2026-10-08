"use client"

import Link from "next/link"
import { ArrowLeft, Share2 } from "lucide-react"
import { toast } from "sonner"
import { useStoreText } from "@/components/site-theme"

/** Barra de color con el título de cada pantalla, el botón de volver y acciones a la derecha. */
export function TitleBar({ title, backHref, share = false, children }: { title: string; backHref?: string; share?: boolean; children?: React.ReactNode }) {
  // En la portada no hay título propio: es el texto editable «Categorías».
  const home = useStoreText("categoriesTitle", "Categorías")
  const shown = title || home
  async function shareLink() {
    const data = { title: shown, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(data.url)
        toast.success("Enlace copiado")
      }
    } catch {
      // Cerró el menú de compartir: no es un error.
    }
  }

  return (
    <div className="bg-st-primary text-st-primary-fg">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-3 px-4 py-2.5">
        {backHref && (
          <Link href={backHref} aria-label="Volver" className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-white/15 st-focus">
            <ArrowLeft className="h-6 w-6" aria-hidden />
          </Link>
        )}
        <h1 className="st-title min-w-0 flex-1 text-2xl md:text-3xl">{shown}</h1>
        <div className="flex shrink-0 items-center gap-2">
          {children}
          {share && (
            <button type="button" onClick={shareLink} aria-label="Compartir" className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-st-primary transition hover:brightness-95 st-focus">
              <Share2 className="h-5 w-5" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Contenido de una pantalla, centrado y con aire para la barra fija de abajo. */
export function PageBody({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto w-full px-4 pb-40 pt-5 md:pt-7 ${narrow ? "max-w-2xl" : "max-w-6xl"}`}>{children}</div>
}
