"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { sanitizeTheme, themeCss, themeFontsHref, type TextKey, type ThemeSettings } from "@/lib/theme"

export type { TextKey }

const ThemeContext = createContext<ThemeSettings | null>(null)

export const PREVIEW_MESSAGE = "its-theme-preview"
export const PREVIEW_READY = "its-theme-ready"

// Aplica el diseño de la tienda (variables CSS + tipografías) y lo comparte con los
// componentes. Dentro de la vista previa del backoffice recibe el borrador en vivo.
export function SiteThemeProvider({ initial, children }: { initial: ThemeSettings; children: React.ReactNode }) {
  const [theme, setTheme] = useState(initial)

  // Si se guarda un diseño nuevo, la página se vuelve a renderizar con `initial` actualizado.
  useEffect(() => setTheme(initial), [initial])

  useEffect(() => {
    // Solo dentro de un iframe del mismo sitio (la vista previa del panel): una visita
    // normal nunca acepta cambios de diseño desde afuera.
    if (window.parent === window) return
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      if (event.data?.type === PREVIEW_MESSAGE) setTheme(sanitizeTheme(event.data.theme))
    }
    window.addEventListener("message", onMessage)
    window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  const css = themeCss(theme)
  const fontsHref = themeFontsHref(theme)

  return (
    <ThemeContext.Provider value={theme}>
      {fontsHref && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="stylesheet" href={fontsHref} />
        </>
      )}
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      {children}
    </ThemeContext.Provider>
  )
}

export function useSiteTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useSiteTheme debe usarse dentro de SiteThemeProvider")
  return context
}

/** Texto de la tienda: el personalizado si existe, si no el original. */
export function useStoreText(key: TextKey, original: string) {
  return useSiteTheme().texts[key] ?? original
}
