"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, X, Check, Plus, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PreviewButton } from "@/components/backoffice/preview-button"
import { SignOutButton } from "@/components/backoffice/sign-out-button"

type MetodoPago = {
  id: number | string
  nombre: string
  activo: boolean
  isNew?: boolean
  isModified?: boolean
  isDeleted?: boolean
}

export default function MetodosPagoPage() {
  const router = useRouter()
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [metodoAEliminar, setMetodoAEliminar] = useState<string | number | null>(null)
  const [nuevoMetodo, setNuevoMetodo] = useState<Omit<MetodoPago, "id">>({
    nombre: "",
    activo: true,
  })
  const [modoEdicion, setModoEdicion] = useState(false)
  const [metodoEditando, setMetodoEditando] = useState<string | number | null>(null)

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/backoffice/payment-methods")

        if (response.ok) {
          const result = await response.json()

          if (result.success && Array.isArray(result.data)) {
            // Map database fields to UI state
            const mappedMethods = result.data.map((method: any) => ({
              id: method.id,
              nombre: method.name,
              activo: method.is_active,
            }))
            setMetodosPago(mappedMethods)
          }
        } else {
          toast.error("Error al cargar métodos de pago")
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error)
        toast.error("Error al cargar métodos de pago")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentMethods()
  }, [])

  const toggleMetodoPago = (id: string | number) => {
    setMetodosPago(
      metodosPago.map((metodo) =>
        metodo.id === id ? { ...metodo, activo: !metodo.activo, isModified: typeof metodo.id === "number" } : metodo,
      ),
    )
  }

  const editarMetodo = (id: string | number) => {
    const metodo = metodosPago.find((m) => m.id === id)
    if (metodo) {
      setNuevoMetodo({
        nombre: metodo.nombre,
        activo: metodo.activo,
      })
      setMetodoEditando(id)
      setModoEdicion(true)
      setIsOpen(true)
    }
  }

  const guardarEdicion = () => {
    if (!metodoEditando) return

    if (nuevoMetodo.nombre.trim() === "") {
      toast.error("El nombre del método de pago es obligatorio")
      return
    }

    const nuevosMetodos = metodosPago.map((metodo) =>
      metodo.id === metodoEditando
        ? {
            ...metodo,
            nombre: nuevoMetodo.nombre,
            activo: nuevoMetodo.activo,
            isModified: typeof metodo.id === "number",
          }
        : metodo,
    )

    setMetodosPago(nuevosMetodos)
    setNuevoMetodo({
      nombre: "",
      activo: true,
    })
    setModoEdicion(false)
    setMetodoEditando(null)
    setIsOpen(false)

    toast.success("Método de pago actualizado en la lista")
  }

  const agregarMetodo = () => {
    if (nuevoMetodo.nombre.trim() === "") {
      toast.error("El nombre del método de pago es obligatorio")
      return
    }

    const nuevosMetodos = [
      ...metodosPago,
      {
        id: `new-${Date.now()}`,
        ...nuevoMetodo,
        isNew: true,
      },
    ]

    setMetodosPago(nuevosMetodos)
    setNuevoMetodo({
      nombre: "",
      activo: true,
    })
    setIsOpen(false)

    toast.success("Método de pago agregado a la lista")
  }

  const confirmarEliminar = (id: string | number) => {
    setMetodoAEliminar(id)
  }

  const eliminarMetodo = () => {
    if (!metodoAEliminar) return

    const metodo = metodosPago.find((m) => m.id === metodoAEliminar)

    if (metodo?.isNew) {
      // If new, just remove from list
      setMetodosPago(metodosPago.filter((m) => m.id !== metodoAEliminar))
      toast.success("Método de pago eliminado")
    } else {
      // If existing, mark as deleted
      setMetodosPago(metodosPago.map((m) => (m.id === metodoAEliminar ? { ...m, isDeleted: true } : m)))
      toast.success("Método de pago marcado para eliminar")
    }

    setMetodoAEliminar(null)
  }

  const handleGuardar = async () => {
    setIsSaving(true)

    try {

      // Process new methods
      const newMethods = metodosPago.filter((m) => m.isNew && !m.isDeleted)
      for (const method of newMethods) {
        const response = await fetch("/api/backoffice/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: method.nombre,
            is_active: method.activo,
            display_order: 0,
          }),
        })

        if (!response.ok) {
          throw new Error("Error al crear método de pago")
        }
      }

      // Process modified methods
      const modifiedMethods = metodosPago.filter((m) => m.isModified && !m.isDeleted && typeof m.id === "number")
      for (const method of modifiedMethods) {
        const response = await fetch("/api/backoffice/payment-methods", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: method.id,
            name: method.nombre,
            is_active: method.activo,
            display_order: 0,
          }),
        })

        if (!response.ok) {
          throw new Error("Error al actualizar método de pago")
        }
      }

      // Process deleted methods
      const deletedMethods = metodosPago.filter((m) => m.isDeleted && typeof m.id === "number")
      for (const method of deletedMethods) {
        const response = await fetch(`/api/backoffice/payment-methods?id=${method.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Error al eliminar método de pago")
        }
      }

      toast.success("Métodos de pago guardados correctamente")

      // Redirect back to the backoffice home
      setTimeout(() => {
        router.push("/backoffice")
      }, 1000)
    } catch (error) {
      console.error("Error saving payment methods:", error)
      toast.error("Error al guardar métodos de pago")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Cargando métodos de pago...</div>
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
          <h1 className="text-xl font-medium text-white">Métodos de pago</h1>
        </div>
        <div className="flex items-center gap-1">
          <PreviewButton />
          <SignOutButton />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-base font-medium text-gray-800 mb-2">Medios de pago</h2>
          <p className="text-sm text-gray-500">
            A continuación, se listarán todos los medios de pagos disponibles. Podrás activarlos o desactivarlos,
            configurar recargos (se calcularán sobre el monto total del pedido), o agregar otros medios de pago
            personalizados.
          </p>
        </div>

        <div className="space-y-4">
          {metodosPago
            .filter((m) => !m.isDeleted)
            .map((metodo) => (
              <div key={metodo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-[#1e4b8e] mr-3" />
                  <span className="text-sm font-medium text-gray-700">{metodo.nombre}</span>
                  {metodo.isNew && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Nuevo</span>
                  )}
                  {metodo.isModified && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Modificado</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editarMetodo(metodo.id)}
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                  >
                    <Pencil className="h-4 w-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmarEliminar(metodo.id)}
                    className="h-8 w-8 p-0 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                  <Switch checked={metodo.activo} onCheckedChange={() => toggleMetodoPago(metodo.id)} />
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
                setMetodoEditando(null)
                setNuevoMetodo({
                  nombre: "",
                  activo: true,
                })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#1e4b8e] text-[#1e4b8e] bg-white">
                <Plus className="mr-2 h-4 w-4" />
                Agregar medio de pago
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-medium text-gray-800">
                  {modoEdicion ? "Editar Método de Pago" : "Agregar Método de Pago"}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Activo</span>
                  <Switch
                    checked={nuevoMetodo.activo}
                    onCheckedChange={(checked) => setNuevoMetodo({ ...nuevoMetodo, activo: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nombre</label>
                  <Input
                    placeholder="Nombre del método de pago"
                    value={nuevoMetodo.nombre}
                    onChange={(e) => setNuevoMetodo({ ...nuevoMetodo, nombre: e.target.value })}
                    className="bg-gray-50 border-0"
                  />
                </div>

                <Button
                  className="w-full bg-[#1e4b8e] hover:bg-[#163a70] flex items-center justify-center gap-2"
                  onClick={modoEdicion ? guardarEdicion : agregarMetodo}
                >
                  <Check className="h-4 w-4" />
                  {modoEdicion ? "Guardar cambios" : "Agregar método de pago"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <AlertDialog open={metodoAEliminar !== null} onOpenChange={(open) => !open && setMetodoAEliminar(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará el método de pago. Si es un método nuevo, se eliminará inmediatamente. Si es un
                método existente, se marcará para eliminar y se borrará al guardar los cambios.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={eliminarMetodo} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
    </div>
  )
}
