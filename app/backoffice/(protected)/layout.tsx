import type React from "react"
import { redirect } from "next/navigation"
import { requireBackofficeSession } from "@/lib/backoffice-auth"

// Real, authoritative session check for every backoffice admin page.
// The proxy only does an optimistic cookie-presence check (fast, but it
// can't validate the session), so this is what actually protects the
// backoffice UI from being reached with a stale or forged cookie.
export default async function ProtectedBackofficeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireBackofficeSession()

  if (!session?.user) {
    redirect("/backoffice/sign-in")
  }

  return (
<>{children}</>
  )
}
