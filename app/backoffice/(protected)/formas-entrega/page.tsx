"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, X, Check, Plus, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PreviewButton } from "@/components/backoffice/preview-button"
import { SignOutButton } from "@/components/backoffice/sign-out-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type FormaEntrega = {
  id: number | string
  nombre: string
  activo: boolean
  /** Costo de envío en pesos (0 = gratis). */
  costo: number
  isRequired?: boolean
  isNew?: boolean
  isModified?: boolean
  isDeleted?: boolean
}

export default function FormasEntregaPage() {
  const router = useRouter()
  const [formasEntrega, setFormasEntrega] = useState<FormaEntrega[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [nuevaForma, setNuevaForma] = useState<Omit<FormaEntrega, "id">>({
    nombre: "",
    activo: true,
    costo: 0,
  })
  const [modoEdicion, setModoEdicion] = useState(false)
  const [formaEditando, setFormaEditando] = useState<string | number | null>(null)
  const [formaAEliminar, setFormaAEliminar] = useState<string | number | null>(null)

  useEffect(() => {
    const fetchDeliveryMethods = async () => {
      try {
        const response = await fetch("/api/backoffice/delivery-methods")

        if (response.ok) {
          const result = await response.json()

          if (result.success && Array.isArray(result.data)) {
            const mappedMethods = result.data.map((method: any) => ({
              id: method.id,
              nombre: method.name,
              activo: method.is_active,
              costo: Math.round(Number(method.delivery_cost) || 0),
              isRequired: method.is_required || false,
            }))
            setFormasEntrega(mappedMethods)
          }
        } else {
          toast.error("Error al cargar formas de entrega")
        }
      } catch (error) {
        console.error("Error fetching delivery methods:", error)
        toast.error("Error al cargar formas de entrega")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeliveryMethods()
  }, [])

  const toggleFormaEntrega = (id: string | number) => {
    setFormasEntrega(
      formasEntrega.map((forma) =>
        forma.id === id ? { ...forma, activo: !forma.activo, isModified: typeof forma.id === "number" } : forma,
      ),
    )
  }

  const editarForma = (id: string | number) => {
    const forma = formasEntrega.find((f) => f.id === id)
    if (forma) {
      if (forma.isRequired) {
        toast.error("No se puede editar una forma de entrega obligatoria")
        return
      }

      setNuevaForma({
        nombre: forma.nombre,
        activo: forma.activo,
        costo: forma.costo,
      })
      setFormaEditando(id)
      setModoEdicion(true)
      setIsOpen(true)
    }
  }

  const guardarEdicion = () => {
    if (!formaEditando) return

    if (nuevaForma.nombre.trim() === "") {
      toast.error("El nombre de la forma de entrega es obligatorio")
      return
    }

    const nuevasFormas = formasEntrega.map((forma) =>
      forma.id === formaEditando
        ? {
            ...forma,
            nombre: nuevaForma.nombre,
            activo: nuevaForma.activo,
            costo: nuevaForma.costo,
            isModified: typeof forma.id === "number",
          }
        : forma,
    )

    setFormasEntrega(nuevasFormas)
    setNuevaForma({
      nombre: "",
      activo: true,
      costo: 0,
    })
    setModoEdicion(false)
    setFormaEditando(null)
    setIsOpen(false)

    toast.success("Forma de entrega actualizada en la lista")
  }

  const agregarForma = () => {
    if (nuevaForma.nombre.trim() === "") {
      toast.error("El nombre de la forma de entrega es obligatorio")
      return
    }

    const nuevasFormas = [
      ...formasEntrega,
      {
        id: `new-${Date.now()}`,
        ...nuevaForma,
        isNew: true,
      },
    ]

    setFormasEntrega(nuevasFormas)
    setNuevaForma({
      nombre: "",
      activo: true,
      costo: 0,
    })
    setIsOpen(false)

    toast.success("Forma de entrega agregada a la lista")
  }

  const eliminarForma = (id: string | number) => {
    const forma = formasEntrega.find((f) => f.id === id)
    if (!forma) return

    if (forma.isRequired) {
      toast.error("No se puede eliminar una forma de entrega obligatoria")
      setFormaAEliminar(null)
      return
    }

    if (forma.isNew) {
      setFormasEntrega(formasEntrega.filter((f) => f.id !== id))
      toast.success("Forma de entrega eliminada de la lista")
    } else {
      setFormasEntrega(formasEntrega.map((f) => (f.id === id ? { ...f, isDeleted: true } : f)))
      toast.success("Forma de entrega marcada para eliminar")
    }
    setFormaAEliminar(null)
  }

  const handleGuardar = async () => {
    setIsSaving(true)

    try {

      const newMethods = formasEntrega.filter((f) => f.isNew && !f.isDeleted)
      for (const method of newMethods) {
        const response = await fetch("/api/backoffice/delivery-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: method.nombre,
            is_active: method.activo,
            delivery_cost: method.costo,
          }),
        })

        if (!response.ok) {
          throw new Error("Error al crear forma de entrega")
        }
      }

      const modifiedMethods = formasEntrega.filter((f) => f.isModified && typeof f.id === "number" && !f.isDeleted)
      for (const method of modifiedMethods) {
        const response = await fetch("/api/backoffice/delivery-methods", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: method.id,
            name: method.nombre,
            is_active: method.activo,
            delivery_cost: method.costo,
          }),
        })

        if (!response.ok) {
          throw new Error("Error al actualizar forma de entrega")
        }
      }

      const deletedMethods = formasEntrega.filter((f) => f.isDeleted && typeof f.id === "number")
      for (const method of deletedMethods) {
        const response = await fetch(`/api/backoffice/delivery-methods?id=${method.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Error al eliminar forma de entrega")
        }
      }

      toast.success("Formas de entrega guardadas correctamente")

      setTimeout(() => {
        router.push("/backoffice")
      }, 1000)
    } catch (error) {
      console.error("Error saving delivery methods:", error)
      toast.error("Error al guardar formas de entrega")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Cargando formas de entrega...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#1e4b8e] text-white">
        <div className="flex items-center">
          <Link href="/backoffice" className="text-white hover:text-gray-200 mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-medium text-white">Formas de entrega</h1>
        </div>
        <div className="flex items-center gap-1">
          <PreviewButton />
          <SignOutButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-base font-medium text-gray-800 mb-2">Formas de entrega</h2>
          <p className="text-sm text-gray-500">
            A continuación, se listarán todas las formas de entrega disponibles. Podrás activarlas o desactivarlas, o
            agregar otras formas de entrega personalizadas.
          </p>
        </div>

        <div className="space-y-4">
          {formasEntrega
            .filter((f) => !f.isDeleted)
            .map((forma) => (
              <div key={forma.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-[#1e4b8e] mr-3" />
                  <span className="text-sm font-medium text-gray-700">{forma.nombre}</span>
                  <span className="ml-2 text-xs text-gray-500">{forma.costo > 0 ? `$ ${forma.costo.toLocaleString("es-AR")}` : "Gratis"}</span>
                  {forma.isNew && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Nuevo</span>
                  )}
                  {forma.isModified && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Modificado</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {!forma.isRequired && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormaAEliminar(forma.id)}
                      className="h-8 w-8 p-0 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                  {!forma.isRequired && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editarForma(forma.id)}
                      className="h-8 w-8 p-0 hover:bg-gray-200"
                    >
                      <Pencil className="h-4 w-4 text-gray-600" />
                    </Button>
                  )}
                  <Switch checked={forma.activo} onCheckedChange={() => toggleFormaEntrega(forma.id)} />
                </div>
              </div>
            ))}
        </div>

        <div className="mt-6 flex gap-4">
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) {
                setModoEdicion(false)
                setFormaEditando(null)
                setNuevaForma({
                  nombre: "",
                  activo: true,
                  costo: 0,
                })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#1e4b8e] text-[#1e4b8e] bg-white">
                <Plus className="mr-2 h-4 w-4" />
                Agregar forma de entrega
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-medium text-gray-800">
                  {modoEdicion ? "Editar Forma de Entrega" : "Agregar Forma de Entrega"}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Activo</span>
                  <Switch
                    checked={nuevaForma.activo}
                    onCheckedChange={(checked) => setNuevaForma({ ...nuevaForma, activo: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nombre</label>
                  <Input
                    placeholder="Nombre de la forma de entrega"
                    value={nuevaForma.nombre}
                    onChange={(e) => setNuevaForma({ ...nuevaForma, nombre: e.target.value })}
                    className="bg-gray-50 border-0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Costo de envío ($)</label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    inputMode="numeric"
                    placeholder="0 = gratis"
                    value={nuevaForma.costo || ""}
                    onChange={(e) => setNuevaForma({ ...nuevaForma, costo: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                    className="bg-gray-50 border-0"
                  />
                  <p className="text-xs text-gray-500">Se suma al total del pedido cuando el cliente elige esta forma de entrega.</p>
                </div>

                <Button
                  className="w-full bg-[#1e4b8e] hover:bg-[#163a70] flex items-center justify-center gap-2"
                  onClick={modoEdicion ? guardarEdicion : agregarForma}
                >
                  <Check className="h-4 w-4" />
                  {modoEdicion ? "Guardar cambios" : "Agregar forma de entrega"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Link href="/backoffice">
            <Button variant="outline" className="border-0 bg-gray-50">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </Link>
          <Button className="bg-[#1e4b8e] hover:bg-[#163a70]" onClick={handleGuardar} disabled={isSaving}>
            <Check className="mr-2 h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <AlertDialog open={formaAEliminar !== null} onOpenChange={(open) => !open && setFormaAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la forma de entrega. Los cambios se guardarán cuando presiones el botón "Guardar".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => formaAEliminar && eliminarForma(formaAEliminar)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
