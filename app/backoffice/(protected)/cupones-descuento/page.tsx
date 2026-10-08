"use client"

import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, AlertTriangle, Info, X, Pencil, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { PreviewButton } from "@/components/backoffice/preview-button"
import { SignOutButton } from "@/components/backoffice/sign-out-button"

interface Coupon {
  id: number
  code: string
  discount_value: number
  discount_type: "percentage" | "fixed"
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at?: string
  isNew?: boolean
  isModified?: boolean
}

export default function CuponesDescuentoPage() {
  const [habilitarCupones, setHabilitarCupones] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [cupones, setCupones] = useState<Coupon[]>([])
  const [deletedCoupons, setDeletedCoupons] = useState<number[]>([])
  const [nuevoCupon, setNuevoCupon] = useState<Partial<Coupon>>({
    code: "",
    discount_value: 0,
    discount_type: "percentage",
    start_date: "",
    end_date: "",
    is_active: true,
  })
  const [modoEdicion, setModoEdicion] = useState(false)
  const [cuponEditando, setCuponEditando] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch enable_coupons config
        const configResponse = await fetch("/api/backoffice/site-config")
        if (configResponse.ok) {
          const configResult = await configResponse.json()
          setHabilitarCupones(configResult.enable_coupons === "true")
        }

        // Fetch coupons
        const couponsResponse = await fetch("/api/backoffice/coupons")
        if (couponsResponse.ok) {
          const couponsResult = await couponsResponse.json()
          if (couponsResult.success && Array.isArray(couponsResult.data)) {
            setCupones(couponsResult.data)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Error al cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleToggleCupones = async (checked: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/backoffice/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enable_coupons: checked.toString(),
        }),
      })

      if (response.ok) {
        setHabilitarCupones(checked)
        toast.success(`Los cupones han sido ${checked ? "habilitados" : "deshabilitados"}`)
      } else {
        throw new Error("Error al guardar")
      }
    } catch (error) {
      console.error("Error saving config:", error)
      toast.error("No se pudo actualizar la configuración")
    } finally {
      setIsLoading(false)
    }
  }

  const agregarCupon = () => {
    if (!nuevoCupon.code?.trim()) {
      toast.error("El código del cupón es obligatorio")
      return
    }

    if (!nuevoCupon.discount_value || nuevoCupon.discount_value <= 0) {
      toast.error("El descuento debe ser mayor a 0")
      return
    }

    // If dates are provided, validate that start_date is before end_date
    if (nuevoCupon.start_date && nuevoCupon.end_date && nuevoCupon.start_date > nuevoCupon.end_date) {
      toast.error("La fecha de inicio debe ser anterior a la fecha de fin")
      return
    }

    const today = new Date().toISOString().split("T")[0]
    const farFuture = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // 10 years from now

    const nuevosCupones = [
      ...cupones,
      {
        id: Date.now(),
        code: nuevoCupon.code,
        discount_value: nuevoCupon.discount_value,
        discount_type: nuevoCupon.discount_type || "percentage",
        start_date: nuevoCupon.start_date || today,
        end_date: nuevoCupon.end_date || farFuture,
        is_active: nuevoCupon.is_active !== false,
        isNew: true,
      } as Coupon,
    ]

    setCupones(nuevosCupones)
    setNuevoCupon({
      code: "",
      discount_value: 0,
      discount_type: "percentage",
      start_date: "",
      end_date: "",
      is_active: true,
    })
    setIsOpen(false)
    toast.success("Cupón agregado (sin guardar)")
  }

  const editarCupon = (id: number) => {
    const cupon = cupones.find((c) => c.id === id)
    if (cupon) {
      setNuevoCupon({
        code: cupon.code,
        discount_value: cupon.discount_value,
        discount_type: cupon.discount_type,
        start_date: cupon.start_date || "",
        end_date: cupon.end_date || "",
        is_active: cupon.is_active,
      })
      setCuponEditando(id)
      setModoEdicion(true)
      setIsOpen(true)
    }
  }

  const guardarEdicion = () => {
    if (!cuponEditando) return

    if (!nuevoCupon.code?.trim()) {
      toast.error("El código del cupón es obligatorio")
      return
    }

    if (!nuevoCupon.discount_value || nuevoCupon.discount_value <= 0) {
      toast.error("El descuento debe ser mayor a 0")
      return
    }

    // If dates are provided, validate that start_date is before end_date
    if (nuevoCupon.start_date && nuevoCupon.end_date && nuevoCupon.start_date > nuevoCupon.end_date) {
      toast.error("La fecha de inicio debe ser anterior a la fecha de fin")
      return
    }

    const today = new Date().toISOString().split("T")[0]
    const farFuture = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const nuevosCupones = cupones.map((cupon) =>
      cupon.id === cuponEditando
        ? {
            ...cupon,
            code: nuevoCupon.code!,
            discount_value: nuevoCupon.discount_value!,
            discount_type: nuevoCupon.discount_type || "percentage",
            start_date: nuevoCupon.start_date || today,
            end_date: nuevoCupon.end_date || farFuture,
            is_active: nuevoCupon.is_active !== false,
            isModified: !cupon.isNew,
          }
        : cupon,
    )

    setCupones(nuevosCupones)
    setNuevoCupon({
      code: "",
      discount_value: 0,
      discount_type: "percentage",
      start_date: "",
      end_date: "",
      is_active: true,
    })
    setModoEdicion(false)
    setCuponEditando(null)
    setIsOpen(false)
    toast.success("Cupón actualizado (sin guardar)")
  }

  const toggleActivo = (id: number) => {
    const nuevosCupones = cupones.map((cupon) =>
      cupon.id === id
        ? {
            ...cupon,
            is_active: !cupon.is_active,
            isModified: !cupon.isNew,
          }
        : cupon,
    )
    setCupones(nuevosCupones)
  }

  const eliminarCupon = () => {
    if (!cuponEditando) return

    const cupon = cupones.find((c) => c.id === cuponEditando)

    if (cupon?.isNew) {
      // If it's a new coupon (not saved yet), just remove it from the list
      setCupones(cupones.filter((c) => c.id !== cuponEditando))
      toast.success("Cupón eliminado")
    } else {
      // If it's an existing coupon, mark it for deletion
      setDeletedCoupons([...deletedCoupons, cuponEditando])
      setCupones(cupones.filter((c) => c.id !== cuponEditando))
      toast.success("Cupón marcado para eliminar (sin guardar)")
    }

    setNuevoCupon({
      code: "",
      discount_value: 0,
      discount_type: "percentage",
      start_date: "",
      end_date: "",
      is_active: true,
    })
    setModoEdicion(false)
    setCuponEditando(null)
    setIsOpen(false)
  }

  const handleGuardar = async () => {
    setIsSaving(true)
    try {
      const newCoupons = cupones.filter((c) => c.isNew)
      const modifiedCoupons = cupones.filter((c) => c.isModified)

      for (const cuponId of deletedCoupons) {
        const response = await fetch("/api/backoffice/coupons", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: cuponId }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error al eliminar cupón")
        }
      }

      // Create new coupons
      for (const cupon of newCoupons) {
        const response = await fetch("/api/backoffice/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: cupon.code,
            discount_type: cupon.discount_type,
            discount_value: cupon.discount_value,
            start_date: cupon.start_date,
            end_date: cupon.end_date,
            is_active: cupon.is_active,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error al crear cupón")
        }
      }

      // Update modified coupons
      for (const cupon of modifiedCoupons) {
        const response = await fetch("/api/backoffice/coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: cupon.id,
            code: cupon.code,
            discount_type: cupon.discount_type,
            discount_value: cupon.discount_value,
            start_date: cupon.start_date,
            end_date: cupon.end_date,
            is_active: cupon.is_active,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error al actualizar cupón")
        }
      }

      toast.success("Cambios guardados exitosamente")

      setDeletedCoupons([])

      // Reload coupons from database
      const couponsResponse = await fetch("/api/backoffice/coupons")
      if (couponsResponse.ok) {
        const couponsResult = await couponsResponse.json()
        if (couponsResult.success && Array.isArray(couponsResult.data)) {
          setCupones(couponsResult.data)
        }
      }
    } catch (error: any) {
      console.error("Error saving coupons:", error)
      toast.error(error.message || "Error al guardar los cambios")
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = cupones.some((c) => c.isNew || c.isModified) || deletedCoupons.length > 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e4b8e] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#1e4b8e] text-white">
        <div className="flex items-center">
          <Link href="/backoffice" className="text-white hover:text-gray-200 mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-medium text-white">Cupones de descuento</h1>
        </div>
        <div className="flex items-center gap-1">
          <PreviewButton />
          <SignOutButton />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6">
        <div
          className={`mb-6 flex items-center justify-between gap-4 rounded-lg border p-4 ${
            habilitarCupones ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-3">
            {habilitarCupones ? (
              <Info className="h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-800">Cupones de descuento</p>
              <p className="text-sm text-gray-600">
                {habilitarCupones
                  ? "Los cupones están habilitados para tus clientes."
                  : "Habilitá los cupones para que tus clientes puedan utilizarlos."}
              </p>
            </div>
          </div>
          <Switch
            checked={habilitarCupones}
            onCheckedChange={handleToggleCupones}
            disabled={isLoading}
            aria-label="Habilitar cupones de descuento"
          />
        </div>

        {cupones.length === 0 ? (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center mb-8">
            <Info className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
            <p className="text-sm text-blue-700">Todavía no configuraste ningún cupón.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {cupones.map((cupon) => (
              <Card key={cupon.id} className="p-4 relative">
                {cupon.isNew && (
                  <span className="absolute top-2 left-2 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    Nuevo
                  </span>
                )}
                {cupon.isModified && (
                  <span className="absolute top-2 left-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                    Modificado
                  </span>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editarCupon(cupon.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="font-medium text-lg mb-2 mt-6">{cupon.code}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Descuento: {cupon.discount_value}
                  {cupon.discount_type === "percentage" ? "%" : " $"}
                </p>
                {cupon.start_date && cupon.end_date && (
                  <p className="text-sm text-gray-600 mb-2">
                    Válido: {cupon.start_date} al {cupon.end_date}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      cupon.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {cupon.is_active ? "Activo" : "Inactivo"}
                  </span>
                  <Switch checked={cupon.is_active} onCheckedChange={() => toggleActivo(cupon.id)} />
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) {
                setModoEdicion(false)
                setCuponEditando(null)
                setNuevoCupon({
                  code: "",
                  discount_value: 0,
                  discount_type: "percentage",
                  start_date: "",
                  end_date: "",
                  is_active: true,
                })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-[#1e4b8e] hover:bg-[#163a70]">
                <Plus className="mr-2 h-4 w-4" />
                Crear nuevo cupón
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[500px] p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-medium text-gray-800">
                  {modoEdicion ? "Editar Cupón" : "Crear Nuevo Cupón"}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Código</label>
                  <Input
                    placeholder="Ej: VERANO2025"
                    value={nuevoCupon.code || ""}
                    onChange={(e) => setNuevoCupon({ ...nuevoCupon, code: e.target.value.toUpperCase() })}
                    className="bg-gray-50 border-0 h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Descuento</label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={nuevoCupon.discount_value || ""}
                      onChange={(e) => setNuevoCupon({ ...nuevoCupon, discount_value: Number(e.target.value) })}
                      className="bg-gray-50 border-0 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Tipo</label>
                    <Select
                      value={nuevoCupon.discount_type}
                      onValueChange={(value) =>
                        setNuevoCupon({ ...nuevoCupon, discount_type: value as "percentage" | "fixed" })
                      }
                    >
                      <SelectTrigger className="bg-gray-50 border-0 h-10">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">$</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Inicio (opcional)</label>
                    <Input
                      type="date"
                      value={nuevoCupon.start_date || ""}
                      onChange={(e) => setNuevoCupon({ ...nuevoCupon, start_date: e.target.value })}
                      className="bg-gray-50 border-0 h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Fin (opcional)</label>
                    <Input
                      type="date"
                      value={nuevoCupon.end_date || ""}
                      onChange={(e) => setNuevoCupon({ ...nuevoCupon, end_date: e.target.value })}
                      className="bg-gray-50 border-0 h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 bg-gray-50 px-3 rounded-lg">
                  <span className="text-sm text-gray-700">Activo</span>
                  <Switch
                    checked={nuevoCupon.is_active !== false}
                    onCheckedChange={(checked) => setNuevoCupon({ ...nuevoCupon, is_active: checked })}
                  />
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-0 bg-gray-50 h-10"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 bg-[#1e4b8e] hover:bg-[#163a70] h-10"
                      onClick={modoEdicion ? guardarEdicion : agregarCupon}
                    >
                      {modoEdicion ? "Guardar" : "Crear"}
                    </Button>
                  </div>
                  {modoEdicion && (
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent h-10"
                      onClick={eliminarCupon}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Eliminar cupón
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {hasChanges && (
            <Button onClick={handleGuardar} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
