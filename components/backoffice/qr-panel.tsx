"use client"

import { useRef, useState } from "react"
import QRCode from "react-qr-code"
import { Check, Download, Printer } from "lucide-react"

const SIZE = 1024

export function QrPanel({ savedUrl, defaultUrl, storeName }: { savedUrl: string | null; defaultUrl: string; storeName: string }) {
  const [url, setUrl] = useState(savedUrl ?? "")
  const [stored, setStored] = useState(savedUrl ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const holder = useRef<HTMLDivElement>(null)

  const target = url.trim() || defaultUrl
  const dirty = url.trim() !== stored

  async function save() {
    const value = url.trim()
    if (value) {
      try {
        const parsed = new URL(value)
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("protocolo")
      } catch {
        setError("Escribí una dirección válida, por ejemplo https://mitienda.com")
        return
      }
    }
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/backoffice/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "qr_store_url", value, description: "Dirección que abre el código QR" }),
      })
      if (!response.ok) throw new Error()
      setStored(value)
    } catch {
      setError("No se pudo guardar la dirección")
    } finally {
      setSaving(false)
    }
  }

  // Convierte el QR (un SVG) en una imagen PNG grande, lista para imprimir.
  function download() {
    const svg = holder.current?.querySelector("svg")
    if (!svg) return
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = SIZE
      const context = canvas.getContext("2d")!
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, SIZE, SIZE)
      const margin = SIZE * 0.06
      context.drawImage(image, margin, margin, SIZE - margin * 2, SIZE - margin * 2)
      const link = document.createElement("a")
      link.download = `qr-${storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`
  }

  return (
    <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
      <div className="mx-auto rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-100 print:shadow-none print:ring-0">
        <div ref={holder} className="rounded bg-white p-2">
          <QRCode value={target} size={224} level="M" />
        </div>
        <p className="mt-3 max-w-56 break-all text-center text-xs text-gray-500">{target}</p>
      </div>

      <div className="space-y-5 print:hidden">
        <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <label htmlFor="qr-url" className="text-sm font-medium text-gray-800">
            Dirección que abre el QR
          </label>
          <p className="mb-2 text-xs text-gray-500">Dejala vacía para usar la dirección actual de la tienda. Si tenés dominio propio, escribilo acá.</p>
          <div className="flex gap-2">
            <input id="qr-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={defaultUrl} className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-sm outline-none focus:border-[#1e4b8e] focus:ring-2 focus:ring-[#1e4b8e]/20" />
            <button type="button" onClick={save} disabled={saving || !dirty} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#1e4b8e] px-4 text-sm font-semibold text-white transition hover:bg-[#1e4b8e]/90 disabled:opacity-50">
              <Check className="h-4 w-4" aria-hidden />
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-md bg-[#1e4b8e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4b8e]/90">
            <Download className="h-4 w-4" aria-hidden /> Descargar PNG
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition hover:text-[#1e4b8e]">
            <Printer className="h-4 w-4" aria-hidden /> Imprimir
          </button>
        </div>
        <p className="text-sm text-gray-500">Imprimilo y ponelo en el local, en las bolsas o en tus redes: al escanearlo, tus clientes entran directo a la tienda.</p>
      </div>
    </div>
  )
}
