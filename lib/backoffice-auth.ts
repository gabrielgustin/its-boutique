import "server-only"
import { headers } from "next/headers"
import { getAuth } from "@/lib/auth"

/**
 * Verifica que el pedido tenga una sesión válida del backoffice.
 * Hay que llamarla al principio de cada ruta y página de administración:
 * el proxy solo mira si existe la cookie, esta es la comprobación real.
 */
export async function requireBackofficeSession() {
  const auth = await getAuth()
  return auth.api.getSession({ headers: await headers() })
}
