import Image from "next/image"
import Link from "next/link"
import {
  Briefcase, ChevronRight, Clock, CreditCard, Grid3X3, Info, Megaphone, Package, Palette, QrCode, ReceiptText, Ticket, type LucideIcon,
} from "lucide-react"
import { PreviewButton } from "@/components/backoffice/preview-button"
import { SignOutButton } from "@/components/backoffice/sign-out-button"

const MAIN: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/backoffice/pedidos", label: "Pedidos", Icon: ReceiptText },
  { href: "/backoffice/categorias", label: "Categorías", Icon: Grid3X3 },
  { href: "/backoffice/productos", label: "Productos", Icon: Briefcase },
]

const SETTINGS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/backoffice/personalizar", label: "Personaliza tu App", Icon: Palette },
  { href: "/backoffice/informacion-negocio", label: "Información del negocio", Icon: Info },
  { href: "/backoffice/horarios-atencion", label: "Horarios de atención", Icon: Clock },
  { href: "/backoffice/formas-entrega", label: "Formas de entrega", Icon: Package },
  { href: "/backoffice/metodos-pago", label: "Métodos de pago", Icon: CreditCard },
  { href: "/backoffice/cupones-descuento", label: "Cupones de descuento", Icon: Ticket },
  { href: "/backoffice/banner-promocional", label: "Banner promocional", Icon: Megaphone },
  { href: "/backoffice/codigo-qr", label: "Código QR", Icon: QrCode },
]

export default function BackofficeHome() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-[#1e4b8e] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 md:px-6">
          <Image src="/images/logoautogestiva.png" alt="Autogestiva" width={500} height={100} className="h-10 w-auto md:h-14" priority />
          <div className="flex shrink-0 items-center gap-1">
            <PreviewButton />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-8">
        <section className="grid gap-3 sm:grid-cols-3">
          {MAIN.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className="flex h-28 flex-col items-center justify-center gap-2 rounded-lg border border-[#1e4b8e] bg-white text-center transition hover:shadow-md">
              <Icon className="h-8 w-8 text-[#1e4b8e]" aria-hidden />
              <span className="font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </section>

        <div>
          <div className="space-y-6">
            <section>
              <h2 className="mb-4 text-xl font-medium text-[#1e4b8e]">Personaliza tu tienda</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {SETTINGS.map(({ href, label, Icon }) => (
                  <Link key={href} href={href} className="flex items-center rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:ring-[#1e4b8e]/40">
                    <span className="mr-4 rounded-lg bg-gray-100 p-2">
                      <Icon className="h-5 w-5 text-[#1e4b8e]" aria-hidden />
                    </span>
                    <span className="flex-1 font-medium text-gray-700">{label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
