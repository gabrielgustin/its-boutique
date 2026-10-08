"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import FloatingWindow from "@/components/backoffice/floating-window"

export function PreviewButton() {
  const [isWindowOpen, setIsWindowOpen] = useState(false)
  const storePreviewUrl = "/"

  return (
    <>
      <Button
        variant="ghost"
        className="px-2 text-white hover:bg-white/10 hover:text-white md:px-4"
        aria-label="Ver tienda en modo cliente"
        onClick={() => setIsWindowOpen(true)}
      >
        <span className="hidden md:flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Ver tienda en modo cliente
        </span>
        <ExternalLink className="md:hidden h-5 w-5" />
      </Button>

      <FloatingWindow url={storePreviewUrl} isOpen={isWindowOpen} onClose={() => setIsWindowOpen(false)} />
    </>
  )
}

export default PreviewButton
