import type React from "react"
import type { Metadata } from "next"
import { StoreProvider } from "@/contexts/store-context"

export const metadata: Metadata = {
  title: "Autogestiva | Backoffice",
  description: "Panel de administración de tu tienda",
}

export default function BackofficeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <StoreProvider>{children}</StoreProvider>
}
