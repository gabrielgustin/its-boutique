import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

// Public backoffice routes that must stay reachable without a session:
// sign-in (to log in) and setup (one-time creation of the first admin).
const PUBLIC_BACKOFFICE_PATHS = ["/backoffice/sign-in", "/backoffice/setup"]
const PUBLIC_API_PATHS = ["/api/backoffice/setup"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isBackofficePage = pathname.startsWith("/backoffice")
  const isBackofficeApi = pathname.startsWith("/api/backoffice")

  if (!isBackofficePage && !isBackofficeApi) {
    return NextResponse.next()
  }

  const isPublicPage = PUBLIC_BACKOFFICE_PATHS.some((path) => pathname.startsWith(path))
  const isPublicApi = PUBLIC_API_PATHS.some((path) => pathname.startsWith(path))

  if (isPublicPage || isPublicApi) {
    return NextResponse.next()
  }

  // Optimistic check only — every page and API route still verifies the
  // real session server-side. This just avoids rendering/querying for
  // requests that obviously have no session cookie at all.
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    if (isBackofficeApi) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const signInUrl = new URL("/backoffice/sign-in", request.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/backoffice/:path*", "/api/backoffice/:path*"],
}
