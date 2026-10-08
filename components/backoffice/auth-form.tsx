"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toLoginEmail } from "@/lib/backoffice-username"

export function BackofficeSignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error: signInError } = await authClient.signIn.email({ email: toLoginEmail(email), password })

    if (signInError) {
      setError("Usuario o contraseña incorrectos")
      setIsLoading(false)
      return
    }

    // Force a full page navigation (not a client-side router.push) so the
    // backoffice's server-side session check always sees the freshly set
    // session cookie on the very next request. A soft navigation can race
    // ahead of the cookie being committed, leaving the user stuck on sign-in
    // until they manually refresh.
    window.location.assign("/backoffice")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="email">Usuario o email</Label>
        <Input
          id="email"
          type="text"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full bg-[#1e4b8e] hover:bg-[#163a70]" disabled={isLoading}>
        {isLoading ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  )
}
