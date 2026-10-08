import type React from "react"
import type { Metadata } from "next"
import { Anton, Lato } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const lato = Lato({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-lato" })
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" })

export const metadata: Metadata = {
  title: "ITS Boutique",
}

// Toda la app lee de la base de datos en cada visita (con caché de datos, ver lib/db.ts):
// nada se genera durante el build.
export const dynamic = "force-dynamic"

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${lato.variable} ${anton.variable}`}>
      <body className={lato.className}>
        {children}
        <Toaster />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
