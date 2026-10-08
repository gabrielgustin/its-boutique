"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function SignOutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignOut() {
    setIsLoading(true)
    await authClient.signOut()
    router.push("/backoffice/sign-in")
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      className="px-2 text-white hover:bg-white/10 hover:text-white md:px-4"
      onClick={handleSignOut}
      disabled={isLoading}
      aria-label="Cerrar sesión"
    >
      <LogOut className="h-4 w-4 md:mr-2" />
      <span className="hidden md:inline">Cerrar sesión</span>
    </Button>
  )
}
