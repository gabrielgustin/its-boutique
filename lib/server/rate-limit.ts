import "server-only"
import { headers } from "next/headers"

// Límite simple por IP, en memoria. Frena abusos básicos (probar cupones, llenar la
// tienda de pedidos falsos). En serverless cada instancia lleva su propia cuenta:
// si hace falta un límite estricto, cambiar este módulo por Upstash/Redis.

const buckets = new Map<string, { count: number; resetAt: number }>()

export async function rateLimit(name: string, max: number, windowSeconds: number): Promise<boolean> {
  const requestHeaders = await headers()
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "local"
  const key = `${name}:${ip}`
  const now = Date.now()

  if (buckets.size > 5000) {
    for (const [entry, bucket] of buckets) if (bucket.resetAt < now) buckets.delete(entry)
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return true
  }
  bucket.count += 1
  return bucket.count <= max
}
