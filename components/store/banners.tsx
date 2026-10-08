"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, Megaphone, X } from "lucide-react"

export function PromoBanner({ text }: { text: string }) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="mb-5 flex items-center gap-3 rounded-st bg-st-secondary px-4 py-3 text-st-secondary-fg" role="note">
      <Megaphone className="h-5 w-5 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{text}</p>
      <button type="button" onClick={() => setVisible(false)} aria-label="Cerrar aviso" className="-mr-1 rounded-full p-1 transition hover:bg-current/10 st-focus">
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}

export function ClosedBanner({ canOrder }: { canOrder: boolean }) {
  return (
    <Link href="/contacto" className="mb-5 flex items-center gap-3 rounded-st bg-st-secondary px-4 py-3 text-st-secondary-fg transition hover:brightness-95 st-focus">
      <Clock className="h-5 w-5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 text-sm leading-snug">
        <span className="block font-semibold">En este momento estamos cerrados</span>
        <span className="opacity-80">{canOrder ? "Podés dejar tu pedido y lo preparamos al abrir. " : ""}Ver horarios de atención.</span>
      </span>
    </Link>
  )
}
