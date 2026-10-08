import { upload } from "@vercel/blob/client"

// Generous ceiling for the raw file selected by the user, before any
// client-side resizing happens.
const MAX_FILE_SIZE = 20 * 1024 * 1024

// Uniform canvas size every uploaded image is normalized into. Images are
// never cropped: they are scaled to fit inside this square and centered.
// The canvas is left transparent (WebP supports alpha) so logos and other
// images with transparent backgrounds keep it — a filled background would
// bake a solid square behind them wherever they're displayed on a colored
// surface (e.g. the store logo in the header).
const CANVAS_SIZE = 1200
const WEBP_QUALITY = 0.82

export class ImageUploadError extends Error {}

function toBaseFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "")
  const safeName = withoutExtension.replace(/[^a-zA-Z0-9_-]+/g, "-").toLowerCase() || "imagen"
  return safeName
}

/**
 * Resizes/converts an image entirely in the browser using <canvas>, instead
 * of sending it to a server route backed by a native image library (sharp).
 * Native image libraries ship platform-specific binaries that can fail to
 * load depending on the deployment target (architecture, libc, bundler),
 * which is what caused uploads to fail with "Error al optimizar la imagen".
 * The Canvas API has no native dependency: it runs the same way in every
 * browser, so this step can never fail for that reason.
 */
async function resizeToWebp(file: File): Promise<Blob | null> {
  if (typeof document === "undefined") return null

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error("No se pudo leer la imagen"))
      img.src = objectUrl
    })

    const canvas = document.createElement("canvas")
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    // A freshly created canvas is already fully transparent, so no fill is
    // needed here — that's what keeps source transparency intact.

    // Scale to fit inside the square (never crop) and center it, mirroring
    // the "contain" behavior of the previous server-side implementation.
    const scale = Math.min(CANVAS_SIZE / image.width, CANVAS_SIZE / image.height)
    const drawWidth = image.width * scale
    const drawHeight = image.height * scale
    const offsetX = (CANVAS_SIZE - drawWidth) / 2
    const offsetY = (CANVAS_SIZE - drawHeight) / 2

    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/webp", WEBP_QUALITY)
    })

    // Some browsers (older Safari) ignore the requested type and return null
    // or fall back silently; treat anything that isn't a real webp blob as
    // "couldn't optimize" so the caller can fall back to the original file.
    if (!blob || blob.type !== "image/webp") return null

    return blob
  } catch {
    // Covers formats the browser's <img> can't decode (e.g. HEIC in
    // Chrome/Firefox) — fall back to uploading the original file untouched.
    return null
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Uploads an image for the backoffice directly from the browser to Blob
 * storage using a short-lived client token, bypassing the request body size
 * limit that Vercel enforces on Route Handlers/Server Actions (~4.5MB).
 *
 * The image is resized and converted to WebP client-side first (see
 * resizeToWebp above). If that isn't possible for any reason, the original
 * file is uploaded as-is rather than failing the whole upload — some image
 * is always better than a hard error for the user.
 */
export async function uploadBackofficeImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new ImageUploadError("Por favor selecciona un archivo de imagen válido")
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ImageUploadError("La imagen no debe superar los 20MB")
  }

  const optimized = await resizeToWebp(file)

  const uploadFile = optimized ?? file
  const fileName = optimized ? `${toBaseFileName(file.name)}.webp` : file.name

  try {
    const mode = (await fetch("/api/backoffice/upload").then((response) => response.json())) as { storage?: string }

    // Desarrollo local: el archivo se guarda en el propio servidor.
    if (mode.storage !== "blob") {
      const body = new FormData()
      body.append("file", uploadFile, fileName)
      const response = await fetch("/api/backoffice/upload", { method: "POST", body })
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!response.ok || !data.url) throw new ImageUploadError(data.error ?? "No se pudo subir la imagen")
      return data.url
    }

    const blob = await upload(fileName, uploadFile, {
      access: "public",
      handleUploadUrl: "/api/backoffice/upload/client-token",
      contentType: uploadFile.type || file.type,
    })

    return blob.url
  } catch (error) {
    if (error instanceof ImageUploadError) throw error
    console.error("Error subiendo la imagen:", error)
    throw new ImageUploadError("No se pudo subir la imagen. Intenta nuevamente.")
  }
}
