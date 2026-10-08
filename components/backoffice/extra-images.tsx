"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { ImageUploadError, uploadBackofficeImage } from "@/lib/backoffice-image-upload"

const MAX_IMAGES = 8

/**
 * Fotos extra de un producto ya creado (la principal se edita arriba).
 * Cada cambio se guarda al momento, sin esperar al botón "Guardar" del producto.
 */
export function ExtraImages({ productId }: { productId: string }) {
  const [urls, setUrls] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    setUrls(null)
    fetch(`/api/backoffice/productos/${productId}/imagenes`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => !cancelled && setUrls(Array.isArray(data) ? data : []))
      .catch(() => !cancelled && setUrls([]))
    return () => {
      cancelled = true
    }
  }, [productId])

  async function save(next: string[]) {
    const response = await fetch(`/api/backoffice/productos/${productId}/imagenes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: next }),
    })
    if (!response.ok) throw new Error("No se pudieron guardar las fotos")
    setUrls(await response.json())
  }

  async function add(files: FileList) {
    setBusy(true)
    setError(null)
    try {
      const current = urls ?? []
      const uploaded: string[] = []
      for (const file of Array.from(files).slice(0, MAX_IMAGES - current.length)) uploaded.push(await uploadBackofficeImage(file))
      await save([...current, ...uploaded])
    } catch (caught) {
      setError(caught instanceof ImageUploadError || caught instanceof Error ? caught.message : "No se pudieron subir las fotos")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }

  async function remove(url: string) {
    setBusy(true)
    setError(null)
    try {
      await save((urls ?? []).filter((entry) => entry !== url))
    } catch {
      setError("No se pudo quitar la foto")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div>
        <p className="text-sm font-medium text-gray-700">Más fotos</p>
        <p className="text-xs text-gray-500">Opcional: hasta {MAX_IMAGES} fotos que el cliente puede deslizar en la ficha del producto.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {urls === null ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" aria-label="Cargando fotos" />
        ) : (
          urls.map((url, index) => (
            <div key={url} className="relative h-20 w-16 overflow-hidden rounded-md border border-gray-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto extra ${index + 1}`} className="h-full w-full object-cover" />
              <button type="button" disabled={busy} onClick={() => remove(url)} aria-label={`Quitar foto ${index + 1}`} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black disabled:opacity-50">
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))
        )}
        {urls !== null && urls.length < MAX_IMAGES && (
          <>
            <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => event.target.files?.length && add(event.target.files)} />
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex h-20 w-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 bg-white text-xs text-gray-500 transition hover:border-[#1e4b8e] hover:text-[#1e4b8e] disabled:opacity-50">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ImagePlus className="h-5 w-5" aria-hidden />}
              {busy ? "Subiendo" : "Agregar"}
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
