import "server-only"
import { betterAuth } from "better-auth"
import { PostgresDialect } from "kysely"
import { getPool, isLocalDatabase, query } from "@/lib/sql"

function resolveBaseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return undefined // en local se toma del pedido (cualquier puerto)
}

function resolveTrustedOrigins() {
  const origins: string[] = []
  if (process.env.BETTER_AUTH_URL) origins.push(process.env.BETTER_AUTH_URL)
  if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) origins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  if (process.env.NODE_ENV === "development") origins.push("http://localhost:*", "http://127.0.0.1:*")
  return origins
}

async function createAuth() {
  const auth = betterAuth({
    database: { dialect: new PostgresDialect({ pool: await getPool() }), type: "postgres" },
    baseURL: resolveBaseURL(),
    // En local hay un secreto fijo de desarrollo; en producción BETTER_AUTH_SECRET es obligatorio.
    secret: process.env.BETTER_AUTH_SECRET ?? (process.env.NODE_ENV === "production" ? undefined : "its-boutique-dev-secret"),
    trustedOrigins: resolveTrustedOrigins(),
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    rateLimit: { enabled: true, window: 60, max: 30 },
    // La sesión del panel dura 12 horas; después hay que volver a entrar.
    session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 60 },
    user: {
      changeEmail: {
        enabled: true,
        // El administrador no pasa por verificación de email: puede cambiar su
        // email de acceso desde el panel sin un proveedor de correo.
        updateEmailWithoutVerification: true,
      },
    },
  })

  await ensureDevAdmin(auth)
  return auth
}

/**
 * Solo en local (PGlite): si .env.local define DEV_ADMIN_EMAIL y DEV_ADMIN_PASSWORD y
 * todavía no hay ningún usuario, crea ese administrador de prueba. En producción el
 * primer administrador se crea una única vez desde /backoffice/setup.
 */
async function ensureDevAdmin(auth: { api: { signUpEmail: (input: { body: { email: string; password: string; name: string } }) => Promise<unknown> } }) {
  const email = process.env.DEV_ADMIN_EMAIL
  const password = process.env.DEV_ADMIN_PASSWORD
  if (!isLocalDatabase || !email || !password) return
  const [{ count }] = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM "user"`)
  if (Number(count) > 0) return
  await auth.api.signUpEmail({ body: { email, password, name: "Administrador" } })
}

export type Auth = Awaited<ReturnType<typeof createAuth>>

// La conexión es asíncrona, así que la instancia se crea una vez y se reutiliza.
const globalStore = globalThis as unknown as { __itsAuth?: Promise<Auth> }

export function getAuth(): Promise<Auth> {
  globalStore.__itsAuth ??= createAuth().catch((error) => {
    globalStore.__itsAuth = undefined
    throw error
  })
  return globalStore.__itsAuth
}
