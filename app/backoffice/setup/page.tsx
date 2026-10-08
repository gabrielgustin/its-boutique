"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function BackofficeSetupPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasAdmin, setHasAdmin] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetch("/api/backoffice/setup")
      .then((res) => res.json())
      .then((data) => setHasAdmin(Boolean(data.hasAdmin)))
      .finally(() => setChecking(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const res = await fetch("/api/backoffice/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "No se pudo crear el administrador")
      setIsLoading(false)
      return
    }

    router.push("/backoffice/sign-in")
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Verificando...</p>
      </div>
    )
  }

  if (hasAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold text-[#1e4b8e] mb-2">Ya hay un administrador configurado</h1>
          <p className="text-sm text-gray-500 mb-6">Iniciá sesión con la cuenta existente.</p>
          <Button className="bg-[#1e4b8e] hover:bg-[#163a70]" onClick={() => router.push("/backoffice/sign-in")}>
            Ir a iniciar sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#1e4b8e]">Crear administrador</h1>
          <p className="text-sm text-gray-500 mt-1">Esta cuenta será la única con acceso al backoffice</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
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
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full bg-[#1e4b8e] hover:bg-[#163a70]" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear administrador"}
          </Button>
        </form>
      </div>
    </div>
  )
}
