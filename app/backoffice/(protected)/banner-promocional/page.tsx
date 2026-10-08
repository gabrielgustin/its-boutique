"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Home, Grid3X3, Briefcase, Megaphone, X, Eye, Menu, Search, ShoppingCart, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { PreviewButton } from "@/components/backoffice/preview-button"
import { SignOutButton } from "@/components/backoffice/sign-out-button"

export default function BannerPromocionalPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bannerText, setBannerText] = useState("")
  const [bannerEnabled, setBannerEnabled] = useState(true)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchBannerConfig()
  }, [])

  const fetchBannerConfig = async () => {
    try {
      const response = await fetch("/api/backoffice/site-config")
      if (!response.ok) throw new Error("Error al cargar configuración")

      const config = await response.json()

      
      setBannerText(config.banner_text || "")
      const enabledValue = config.banner_enabled === "true" || config.banner_enabled === true
      setBannerEnabled(enabledValue)
    } catch (error) {
      console.error("Error fetching banner config:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración del banner",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (bannerText.length > 150) {
      toast({
        title: "Error",
        description: "El texto del banner no debe exceder 150 caracteres",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {

      const response = await fetch("/api/backoffice/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner_text: bannerText,
          banner_enabled: String(bannerEnabled),
        }),
      })

      if (!response.ok) throw new Error("Error al guardar")

      toast({
        title: "✓ Cambios guardados",
        description: "La configuración del banner ha sido actualizada",
      })
      
      setTimeout(() => {
        router.push("/backoffice")
      }, 1000)
    } catch (error) {
      console.error("Error saving banner:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-[#1e4b8e] text-white">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/backoffice">
              <Button variant="ghost" className="text-white hover:bg-white/10 p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Banner Promocional</h1>
          </div>
          <div className="flex items-center gap-1">
            <PreviewButton />
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-500">Cargando...</div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Texto del Banner</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e4b8e]"
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="Ej: PROMOCIÓN - 10% OFF EN PRODUCTOS SELECCIONADOS"
                      rows={3}
                      maxLength={150}
                    />
                    <p className="text-sm text-gray-500 mt-1">{bannerText.length}/150 caracteres</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={bannerEnabled}
                    onChange={(e) => setBannerEnabled(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="enabled" className="text-sm font-medium">
                      Banner habilitado
                    </label>
                  </div>

                  <Button onClick={() => setShowPreview(!showPreview)} variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? "Ocultar" : "Ver"} Vista Previa en la App
                  </Button>

                  {showPreview && (
                    <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-100 shadow-xl">
                      <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                        
                        <iframe
                          src="/?previewBanner=true"
                          className="w-full h-[600px] border-0"
                          title="Vista previa ilustrativa de la aplicación"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#1e4b8e] hover:bg-[#163a70]">
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
