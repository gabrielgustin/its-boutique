"use client"

import { useEffect } from "react"

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="st-raised mx-auto my-10 max-w-md px-6 py-14 text-center">
      <p className="st-heading text-xl font-semibold">Algo salió mal</p>
      <p className="mt-1 text-sm text-st-muted">No pudimos cargar esta pantalla. Probá de nuevo en unos segundos.</p>
      <button type="button" onClick={reset} className="st-btn mt-6 st-focus">
        Reintentar
      </button>
    </div>
  )
}
