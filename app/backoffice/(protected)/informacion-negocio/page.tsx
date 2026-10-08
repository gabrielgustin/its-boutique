"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleMapsPicker } from "@/components/backoffice/google-maps-picker"
import { PreviewButton } from "@/components/backoffice/preview-button"
import { SignOutButton } from "@/components/backoffice/sign-out-button"
import { useStore } from "@/contexts/store-context"
import { useToast } from "@/hooks/use-toast"
import { uploadBackofficeImage } from "@/lib/backoffice-image-upload"
import { authClient } from "@/lib/auth-client"

export default function InformacionNegocioPage() {
  const { informacionNegocio, setInformacionNegocio } = useStore()
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState({
    logo: "",
    numeroWhatsApp: "",
    ubicacion: "",
    ubicacionLat: undefined as number | undefined,
    ubicacionLng: undefined as number | undefined,
    sitioWeb: "",
    instagram: "",
    facebook: "",
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: session } = authClient.useSession()

  const [emailForm, setEmailForm] = useState({ nuevoEmail: "", contrasenaActual: "" })
  const [savingEmail, setSavingEmail] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    contrasenaActual: "",
    nuevaContrasena: "",
    confirmarContrasena: "",
  })
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/backoffice/site-config")
        if (response.ok) {
          const config = await response.json()

          const loadedData = {
            logo: config.store_logo || "",
            numeroWhatsApp: config.contact_whatsapp || "",
            ubicacion: config.store_location || "",
            ubicacionLat: config.store_location_lat ? Number.parseFloat(config.store_location_lat) : undefined,
            ubicacionLng: config.store_location_lng ? Number.parseFloat(config.store_location_lng) : undefined,
            sitioWeb: config.website_url || "",
            instagram: config.instagram_url || "",
            facebook: config.facebook_url || "",
          }

          setFormData(loadedData)
          if (config.store_logo) {
            setLogoPreview(config.store_logo)
          }
        }
      } catch (error) {
        console.error("Error fetching config:", error)
      }
    }
    fetchConfig()
  }, [])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const url = await uploadBackofficeImage(file)

      const configResponse = await fetch("/api/backoffice/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "store_logo",
          value: url,
          description: "Logo de la tienda",
        }),
      })

      if (!configResponse.ok) {
        throw new Error("Error al guardar el logo")
      }

      setLogoPreview(url)
      handleChange("logo", url)

      toast({
        title: "Logo actualizado",
        description: "El logo se ha subido correctamente",
      })
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo subir el logo. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    try {
      const response = await fetch("/api/backoffice/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "store_logo",
          value: "",
          description: "Logo de la tienda",
        }),
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el logo")
      }

      setLogoPreview("")
      handleChange("logo", "")

      toast({
        title: "Logo eliminado",
        description: "El logo se ha eliminado correctamente",
      })
    } catch (error) {
      console.error("Error removing logo:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el logo",
        variant: "destructive",
      })
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    const nuevoEmail = emailForm.nuevoEmail.trim().toLowerCase()
    const currentEmail = session?.user?.email

    if (!nuevoEmail || !emailForm.contrasenaActual) {
      toast({
        title: "Error",
        description: "Completa el nuevo email y tu contraseña actual",
        variant: "destructive",
      })
      return
    }

    if (currentEmail && nuevoEmail === currentEmail.toLowerCase()) {
      toast({
        title: "Error",
        description: "El nuevo email debe ser distinto al actual",
        variant: "destructive",
      })
      return
    }

    if (!currentEmail) {
      toast({
        title: "Error",
        description: "No se pudo verificar tu sesión. Recarga la página e intenta nuevamente.",
        variant: "destructive",
      })
      return
    }

    setSavingEmail(true)
    try {
      // Re-verify the current password before changing the login email,
      // since Better Auth's changeEmail endpoint trusts the active session
      // alone and does not ask for a password by itself.
      const { error: reauthError } = await authClient.signIn.email({
        email: currentEmail,
        password: emailForm.contrasenaActual,
      })

      if (reauthError) {
        toast({
          title: "Error",
          description: "La contraseña actual es incorrecta",
          variant: "destructive",
        })
        return
      }

      const { error: changeError } = await authClient.changeEmail({ newEmail: nuevoEmail })

      if (changeError) {
        toast({
          title: "Error",
          description: changeError.message || "No se pudo actualizar el email",
          variant: "destructive",
        })
        return
      }

      setEmailForm({ nuevoEmail: "", contrasenaActual: "" })
      toast({
        title: "Email actualizado",
        description: "Tu email de inicio de sesión ha sido actualizado correctamente",
      })
    } catch (error) {
      console.error("Error changing email:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el email. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSavingEmail(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordForm.contrasenaActual || !passwordForm.nuevaContrasena || !passwordForm.confirmarContrasena) {
      toast({
        title: "Error",
        description: "Completa todos los campos de contraseña",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.nuevaContrasena.length < 8) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.nuevaContrasena !== passwordForm.confirmarContrasena) {
      toast({
        title: "Error",
        description: "Las contraseñas nuevas no coinciden",
        variant: "destructive",
      })
      return
    }

    setSavingPassword(true)
    try {
      const { error } = await authClient.changePassword({
        currentPassword: passwordForm.contrasenaActual,
        newPassword: passwordForm.nuevaContrasena,
        revokeOtherSessions: true,
      })

      if (error) {
        toast({
          title: "Error",
          description: "La contraseña actual es incorrecta",
          variant: "destructive",
        })
        return
      }

      setPasswordForm({ contrasenaActual: "", nuevaContrasena: "", confirmarContrasena: "" })
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la contraseña. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSavingPassword(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formData.sitioWeb)
    toast({
      title: "Link copiado",
      description: "El link de la tienda se ha copiado al portapapeles",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación básica
    if (!formData.logo) {
      toast({
        title: "Error",
        description: "Por favor sube un logo antes de guardar",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {

      const whatsappWithPrefix = formData.numeroWhatsApp.startsWith("+54")
        ? formData.numeroWhatsApp
        : `+54 ${formData.numeroWhatsApp.trim()}`

      const configData = {
        store_logo: formData.logo,
        contact_whatsapp: whatsappWithPrefix,
        store_location: formData.ubicacion,
        store_location_lat: formData.ubicacionLat?.toString() || "",
        store_location_lng: formData.ubicacionLng?.toString() || "",
        website_url: formData.sitioWeb,
        instagram_url: formData.instagram,
        facebook_url: formData.facebook,
      }


      const response = await fetch("/api/backoffice/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      })


      if (!response.ok) {
        const errorData = await response.json()
        console.error("API error response:", errorData)
        throw new Error("Error al guardar la configuración")
      }

      const responseData = await response.json()

      setInformacionNegocio((current) => ({ ...current, ...formData }))

      toast({
        title: "Información guardada",
        description: "La información del negocio ha sido guardada correctamente en la base de datos",
      })

      setTimeout(() => {
        router.push("/backoffice")
      }, 1000)
    } catch (error) {
      console.error("Error saving business info:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la información. Intenta nuevamente.",
        variant: "destructive",
      })
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-[#1e4b8e] text-white">
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3 md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-2 md:gap-4">
            <Link href="/backoffice" className="shrink-0 text-white hover:text-gray-200">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="truncate text-base font-medium text-white md:text-xl">Información del negocio</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <PreviewButton />
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Logo</label>
            <p className="text-xs text-gray-500">
              Te recomendamos que el logo tenga formato PNG con fondo transparente (si no cargas ninguno mostraremos el
              nombre de tu tienda).
            </p>

            {logoPreview && (
              <div className="mt-3 relative inline-block">
                <div className="relative w-48 h-48">
                  <Image
                    src={logoPreview || "/placeholder.svg"}
                    alt="Logo preview"
                    fill
                    className="object-contain"
                    onError={() => {
                      setLogoPreview("")
                      toast({
                        title: "Error",
                        description: "No se pudo cargar la imagen",
                        variant: "destructive",
                      })
                    }}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 rounded-full h-8 w-8 p-0"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
            <Button
              variant="outline"
              className="mt-2 bg-gray-50 border-0 flex items-center"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {logoPreview ? "Cambiar imagen" : "Seleccionar imagen"}
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Número WhatsApp</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-2 rounded-md border border-gray-300">
                +54
              </span>
              <Input
                placeholder="Ej: 9 11 1234 5678"
                value={formData.numeroWhatsApp.replace(/^\+54\s*/, "")}
                onChange={(e) => {
                  const value = e.target.value.replace(/^\+54\s*/, "")
                  setFormData({ ...formData, numeroWhatsApp: value })
                }}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ubicación de tu tienda</label>
            <GoogleMapsPicker
              value={formData.ubicacion}
              onChange={(address, lat, lng) => {
                setFormData({
                  ...formData,
                  ubicacion: address,
                  ubicacionLat: lat,
                  ubicacionLng: lng,
                })
              }}
              placeholder="Buscar dirección de tu tienda..."
            />
            <p className="text-xs text-gray-500">
              Ingresa la dirección completa de tu tienda. Puedes usar Google Maps para obtener la dirección exacta.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Links</h2>
            <p className="text-sm text-gray-500 mb-4">
              Opcional. Configura los links de tu página web y/o redes sociales como Instagram, Facebook o Twitter. Los
              usuarios podrán visualizarlos en el menú lateral de tu Tienda.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sitio Web</label>
                <Input
                  placeholder="https://www.tusitio.com"
                  value={formData.sitioWeb}
                  onChange={(e) => handleChange("sitioWeb", e.target.value)}
                  className="bg-gray-50 border-0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Instagram</label>
                <Input
                  placeholder="https://www.instagram.com/tuusuario"
                  value={formData.instagram}
                  onChange={(e) => handleChange("instagram", e.target.value)}
                  className="bg-gray-50 border-0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Facebook</label>
                <Input
                  placeholder="https://www.facebook.com/tuusuario"
                  value={formData.facebook}
                  onChange={(e) => handleChange("facebook", e.target.value)}
                  className="bg-gray-50 border-0"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-gray-100">
          <h2 className="text-lg font-medium text-gray-800 mb-1">Credenciales de acceso</h2>
          <p className="text-sm text-gray-500 mb-6">
            Actualiza el email y la contraseña que usas para ingresar al backoffice.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <form onSubmit={handleChangeEmail} className="space-y-4 rounded-lg bg-gray-50 p-4">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Cambiar email de acceso</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Email actual: <span className="font-medium">{session?.user?.email || "..."}</span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nuevo email</label>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="nuevo@email.com"
                  value={emailForm.nuevoEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, nuevoEmail: e.target.value })}
                  className="bg-white border-0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contraseña actual</label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={emailForm.contrasenaActual}
                  onChange={(e) => setEmailForm({ ...emailForm, contrasenaActual: e.target.value })}
                  className="bg-white border-0"
                />
              </div>

              <Button type="submit" className="bg-[#1e4b8e] hover:bg-[#163a70]" disabled={savingEmail}>
                {savingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar email"
                )}
              </Button>
            </form>

            <form onSubmit={handleChangePassword} className="space-y-4 rounded-lg bg-gray-50 p-4">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Cambiar contraseña</h3>
                <p className="text-xs text-gray-500 mt-1">Debe tener al menos 8 caracteres.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contraseña actual</label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={passwordForm.contrasenaActual}
                  onChange={(e) => setPasswordForm({ ...passwordForm, contrasenaActual: e.target.value })}
                  className="bg-white border-0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={passwordForm.nuevaContrasena}
                  onChange={(e) => setPasswordForm({ ...passwordForm, nuevaContrasena: e.target.value })}
                  className="bg-white border-0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirmar nueva contraseña</label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={passwordForm.confirmarContrasena}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmarContrasena: e.target.value })}
                  className="bg-white border-0"
                />
              </div>

              <Button type="submit" className="bg-[#1e4b8e] hover:bg-[#163a70]" disabled={savingPassword}>
                {savingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar contraseña"
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Link href="/backoffice">
            <Button variant="outline" className="border-0 bg-gray-50">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </Link>
          <Button className="bg-[#1e4b8e] hover:bg-[#163a70]" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
