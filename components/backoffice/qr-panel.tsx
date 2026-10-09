"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "react-qr-code"
import { Download, Printer } from "lucide-react"

// Lámina A4 a 150 ppp: es la misma imagen para la vista previa, la descarga y la impresión.
const WIDTH = 1240
const HEIGHT = 1754
const BLUE = "#1e4b8e"
const DARK = "#102547"
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function loadImage(src: string, crossOrigin = false) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    if (crossOrigin) image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight: string) {
  let current = size
  ctx.font = `${weight} ${current}px ${FONT}`
  while (ctx.measureText(text).width > maxWidth && current > 18) {
    current -= 2
    ctx.font = `${weight} ${current}px ${FONT}`
  }
}

async function drawPoster(qrSvg: SVGSVGElement, { logoUrl, storeName, url }: { logoUrl: string | null; storeName: string; url: string }) {
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext("2d")!
  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"

  const [qr, logo] = await Promise.all([
    loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(qrSvg))}`),
    logoUrl ? loadImage(logoUrl, true) : Promise.resolve(null),
  ])

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Franja superior con círculos suaves, como las tarjetas de la tienda.
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, WIDTH, 560)
  ctx.clip()
  ctx.fillStyle = BLUE
  ctx.fillRect(0, 0, WIDTH, 560)
  ctx.fillStyle = "rgba(255,255,255,0.08)"
  for (const [x, y, r] of [[1080, 90, 330], [120, 520, 260], [640, -60, 190]]) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // Logo (o el nombre de la tienda) sobre una tarjeta blanca.
  const cardW = 700
  const cardH = 320
  const cardX = (WIDTH - cardW) / 2
  const cardY = 130
  ctx.save()
  ctx.shadowColor = "rgba(0,0,0,0.25)"
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 14
  ctx.fillStyle = "#ffffff"
  roundedRect(ctx, cardX, cardY, cardW, cardH, 48)
  ctx.fill()
  ctx.restore()
  if (logo) {
    const scale = Math.min((cardW - 100) / logo.width, (cardH - 70) / logo.height)
    const w = logo.width * scale
    const h = logo.height * scale
    ctx.drawImage(logo, (WIDTH - w) / 2, cardY + (cardH - h) / 2, w, h)
  } else {
    ctx.fillStyle = BLUE
    fitText(ctx, storeName, cardW - 100, 96, "800")
    ctx.fillText(storeName, WIDTH / 2, cardY + cardH / 2 + 30)
  }

  // Título.
  ctx.fillStyle = BLUE
  fitText(ctx, "¡Escaneá y hacé tu pedido!", WIDTH - 160, 92, "800")
  ctx.fillText("¡Escaneá y hacé tu pedido!", WIDTH / 2, 700)
  ctx.fillStyle = "#6b7280"
  ctx.font = `400 42px ${FONT}`
  ctx.fillText("Apuntá la cámara de tu celular al código", WIDTH / 2, 775)

  // Código QR dentro de un marco.
  const frame = 700
  const frameX = (WIDTH - frame) / 2
  const frameY = 850
  ctx.save()
  ctx.shadowColor = "rgba(16,37,71,0.18)"
  ctx.shadowBlur = 36
  ctx.shadowOffsetY = 12
  ctx.fillStyle = "#ffffff"
  roundedRect(ctx, frameX, frameY, frame, frame, 44)
  ctx.fill()
  ctx.restore()
  ctx.lineWidth = 14
  ctx.strokeStyle = BLUE
  roundedRect(ctx, frameX + 7, frameY + 7, frame - 14, frame - 14, 40)
  ctx.stroke()
  if (qr) {
    const size = frame - 120
    ctx.drawImage(qr, frameX + 60, frameY + 60, size, size)
  }

  // Dirección de la tienda.
  ctx.fillStyle = DARK
  fitText(ctx, url.replace(/^https?:\/\//, "").replace(/\/$/, ""), WIDTH - 200, 46, "700")
  ctx.fillText(url.replace(/^https?:\/\//, "").replace(/\/$/, ""), WIDTH / 2, 1650)

  // Franja inferior.
  ctx.fillStyle = BLUE
  ctx.fillRect(0, HEIGHT - 70, WIDTH, 70)
  ctx.fillStyle = "#ffffff"
  fitText(ctx, storeName, WIDTH - 200, 34, "700")
  ctx.fillText(storeName, WIDTH / 2, HEIGHT - 26)

  return canvas.toDataURL("image/png")
}

export function QrPanel({ url, logoUrl, storeName }: { url: string; logoUrl: string | null; storeName: string }) {
  const [poster, setPoster] = useState<string | null>(null)
  const holder = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const svg = holder.current?.querySelector("svg")
    if (!svg) return
    let cancelled = false
    drawPoster(svg, { logoUrl, storeName, url }).then((image) => !cancelled && setPoster(image))
    return () => {
      cancelled = true
    }
  }, [url, logoUrl, storeName])

  function download() {
    if (!poster) return
    const link = document.createElement("a")
    link.download = `qr-${storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`
    link.href = poster
    link.click()
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-start">
      {/* Al imprimir solo sale la lámina, a página completa. */}
      <style>{`@media print { @page { size: A4; margin: 0 } }`}</style>

      {/* QR de origen: se dibuja oculto y se usa para armar la lámina. */}
      <div ref={holder} className="hidden" aria-hidden>
        <QRCode value={url} size={512} level="M" fgColor={DARK} bgColor="#ffffff" />
      </div>

      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-gray-200 print:max-w-none print:rounded-none print:shadow-none print:ring-0">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={`Lámina con el código QR de ${storeName}`} className="block h-auto w-full" />
        ) : (
          <div className="flex aspect-[1240/1754] items-center justify-center text-sm text-gray-400">Preparando…</div>
        )}
      </div>

      <div className="space-y-4 print:hidden">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={download} disabled={!poster} className="inline-flex items-center gap-2 rounded-md bg-[#1e4b8e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4b8e]/90 disabled:opacity-50">
            <Download className="h-4 w-4" aria-hidden /> Descargar PNG
          </button>
          <button type="button" onClick={() => window.print()} disabled={!poster} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition hover:text-[#1e4b8e] disabled:opacity-50">
            <Printer className="h-4 w-4" aria-hidden /> Imprimir
          </button>
        </div>
        <p className="text-sm text-gray-500">Imprimilo y ponelo en el local, en las bolsas o en tus redes: al escanearlo, tus clientes entran directo a la tienda.</p>
      </div>
    </div>
  )
}
