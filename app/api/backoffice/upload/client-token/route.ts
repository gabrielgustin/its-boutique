import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

// Issues short-lived tokens that let the browser upload the image file
// directly to Blob storage, bypassing the request body size limit that
// Vercel enforces on Route Handlers (~4.5MB). Resizing/WebP conversion
// happens client-side (see lib/backoffice-image-upload.ts) before this is
// called, so the file received here is typically already optimized.
export async function POST(request: Request) {
  if (!(await requireBackofficeSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"],
          addRandomSuffix: true,
          maximumSizeInBytes: 20 * 1024 * 1024,
        }
      },
      onUploadCompleted: async ({ blob }) => {
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Error generating client upload token:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al preparar la subida" },
      { status: 400 },
    )
  }
}
