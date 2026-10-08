"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Home, Grid3X3, Briefcase, Plus, X, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useStore, type Categoria } from "@/contexts/store-context"
import { useToast } from "@/hooks/use-toast"
import PreviewButton from "@/components/backoffice/preview-button"
import { SignOutButton } from "@/components/backoffice/sign-out-button"
import { uploadBackofficeImage } from "@/lib/backoffice-image-upload"

export default function CategoriasPage() {
  const { categorias, setCategorias, productos, refetchCategorias, loading } = useStore()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [reordenandoId, setReordenandoId] = useState<string | null>(null)
  const [nuevaCategoria, setNuevaCategoria] = useState<Omit<Categoria, "id">>({
    nombre: "",
    visible: true,
    imagen: "/placeholder.svg?height=400&width=400",
  })
  const [isWindowOpen, setIsWindowOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [subcategorias, setSubcategorias] = useState<Array<{ id: string; nombre: string; categoria_id: string }>>([])
  const [nuevaSubcategoria, setNuevaSubcategoria] = useState("")
  const [loadingSubcategorias, setLoadingSubcategorias] = useState(false)
  const [addingSubcategoria, setAddingSubcategoria] = useState(false)
  const [recienAgregadaId, setRecienAgregadaId] = useState<string | null>(null)

  const cargarSubcategorias = async (categoriaId: string) => {
    setLoadingSubcategorias(true)
    try {
      const response = await fetch(`/api/backoffice/subcategorias?categoria_id=${categoriaId}`)
      if (!response.ok) throw new Error("Error al cargar subcategorías")
      const data = await response.json()
      setSubcategorias(data)
    } catch (error) {
      console.error("Error loading subcategorias:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las subcategorías",
        variant: "destructive",
      })
    } finally {
      setLoadingSubcategorias(false)
    }
  }

  const agregarSubcategoria = async () => {
    if (!categoriaEditando || nuevaSubcategoria.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre de la subcategoría es obligatorio",
        variant: "destructive",
      })
      return
    }

    setAddingSubcategoria(true)
    try {
      const response = await fetch("/api/backoffice/subcategorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevaSubcategoria,
          categoria_id: categoriaEditando,
        }),
      })

      if (!response.ok) throw new Error("Error al crear subcategoría")

      const nueva = await response.json()

      await cargarSubcategorias(categoriaEditando)
      setNuevaSubcategoria("")
      setRecienAgregadaId(nueva.id)
      setTimeout(() => setRecienAgregadaId(null), 500)

    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar la subcategoría",
        variant: "destructive",
      })
    } finally {
      setAddingSubcategoria(false)
    }
  }

  const eliminarSubcategoria = async (subcategoriaId: string) => {
    if (!categoriaEditando) return

    try {
      const response = await fetch(`/api/backoffice/subcategorias?id=${subcategoriaId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar subcategoría")

      await cargarSubcategorias(categoriaEditando)

      toast({
        title: "Subcategoría eliminada",
        description: "La subcategoría ha sido eliminada correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la subcategoría",
        variant: "destructive",
      })
    }
  }

  const moverCategoria = async (categoriaId: string, direccion: "arriba" | "abajo") => {
    const index = categorias.findIndex((cat) => cat.id === categoriaId)
    const nuevoIndex = direccion === "arriba" ? index - 1 : index + 1

    if (index === -1 || nuevoIndex < 0 || nuevoIndex >= categorias.length) return

    const reordenadas = [...categorias]
    const [movida] = reordenadas.splice(index, 1)
    reordenadas.splice(nuevoIndex, 0, movida)

    setReordenandoId(categoriaId)
    setCategorias(reordenadas)

    try {
      const response = await fetch("/api/backoffice/categorias/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordenadas.map((cat) => cat.id) }),
      })

      if (!response.ok) throw new Error("Error al reordenar")
    } catch (error) {
      console.error("Error reordering categorias:", error)
      toast({
        title: "Error",
        description: "No se pudo reordenar la categoría",
        variant: "destructive",
      })
      await refetchCategorias()
    } finally {
      setReordenandoId(null)
    }
  }

  const getSubcategoriasCountPorCategoria = (categoriaId: string) => {
    const productosDeCategoria = productos.filter((p) => p.categoria === categoriaId)
    const subcategoriasUnicas = new Set(
      productosDeCategoria.map((p) => p.subcategoria).filter((s) => s && s.trim() !== ""),
    )
    return subcategoriasUnicas.size
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && menuOpen) {
        setMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [menuOpen])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {

      const url = await uploadBackofficeImage(file)


      setNuevaCategoria({ ...nuevaCategoria, imagen: url })

      toast({
        title: "Imagen cargada",
        description: "La imagen ha sido cargada correctamente",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cargar la imagen",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const agregarCategoria = async () => {
    if (nuevaCategoria.nombre.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre de la categoría es obligatorio",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/backoffice/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaCategoria),
      })

      if (!response.ok) {
        throw new Error("Error al crear categoría")
      }

      await refetchCategorias()
      setNuevaCategoria({
        nombre: "",
        visible: true,
        imagen: "/placeholder.svg?height=400&width=400",
      })
      setIsOpen(false)

      toast({
        title: "Categoría agregada",
        description: "La categoría ha sido agregada correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar la categoría",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const editarCategoria = (id: string) => {
    const categoria = categorias.find((cat) => cat.id === id)
    if (categoria) {
      setNuevaCategoria({
        nombre: categoria.nombre,
        visible: categoria.visible,
        imagen: categoria.imagen,
      })
      setCategoriaEditando(id)
      setModoEdicion(true)
      setIsOpen(true)
      cargarSubcategorias(id)
    }
  }

  const guardarEdicion = async () => {
    if (!categoriaEditando) return

    if (nuevaCategoria.nombre.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre de la categoría es obligatorio",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/backoffice/categorias/${categoriaEditando}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaCategoria),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar categoría")
      }

      await refetchCategorias()
      setNuevaCategoria({
        nombre: "",
        visible: true,
        imagen: "/placeholder.svg?height=400&width=400",
      })
      setModoEdicion(false)
      setCategoriaEditando(null)
      setIsOpen(false)
      setSubcategorias([])

      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const eliminarCategoria = async () => {
    if (!categoriaEditando) return

    setSaving(true)
    try {
      const response = await fetch(`/api/backoffice/categorias/${categoriaEditando}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar categoría")
      }

      await refetchCategorias()
      setIsOpen(false)
      setModoEdicion(false)
      setCategoriaEditando(null)
      setSubcategorias([])

      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-[#1e4b8e] text-white relative">
        <button
          className="md:hidden absolute top-1/2 -translate-y-1/2 left-3 sm:left-4 z-40 bg-[#1e4b8e] text-white p-2 sm:p-3 rounded-md flex flex-col gap-1 sm:gap-1.5 items-start"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú de navegación"
        >
          <span
            className={`block h-0.5 w-5 sm:w-6 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-1.5 w-5 sm:w-6" : ""}`}
          ></span>
          <span
            className={`block h-0.5 w-4 sm:w-5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
          ></span>
          <span
            className={`block h-0.5 w-3 sm:w-4 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-1.5 w-5 sm:w-6" : ""}`}
          ></span>
        </button>
        <div className="container mx-auto flex flex-row items-center justify-between gap-2 pl-14 pr-3 py-2 sm:gap-0 sm:px-6 sm:py-4 sm:pl-6">
          <div className="flex min-w-0 items-center">
            <Image
              src="/images/logoautogestiva.png"
              alt="Autogestiva"
              width={500}
              height={100}
              className="h-9 w-auto sm:h-20"
              priority
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <PreviewButton />
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 flex flex-col md:flex-row gap-4 sm:gap-6 pr-4 pt-0">
        <div className="w-full md:w-[250px] lg:w-[300px]">
          {menuOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMenuOpen(false)} />}

          <div
            className={`${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 fixed md:relative top-0 left-0 w-[280px] md:w-auto h-full md:h-auto bg-[#1e4b8e] text-white p-6 rounded-none md:rounded-lg z-50 md:z-0 transition-transform duration-300 ease-in-out`}
          >
            <button
              className="md:hidden absolute top-4 right-4 text-white"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-lg font-medium mb-6 mt-2 md:mt-0">Navegación</h3>

            <div className="space-y-4">
              <Link href="/backoffice" className="flex items-center hover:underline" onClick={() => setMenuOpen(false)}>
                <Home className="h-5 w-5 mr-4" />
                Inicio
              </Link>

              <Link
                href="/backoffice/categorias"
                className="flex items-center hover:underline font-semibold"
                onClick={() => setMenuOpen(false)}
              >
                <Grid3X3 className="h-5 w-5 mr-4" />
                Categorías
              </Link>

              <Link href="/backoffice/productos" className="flex items-center hover:underline" onClick={() => setMenuOpen(false)}>
                <Briefcase className="h-5 w-5 mr-4" />
                Productos
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Categorías</h1>
            <Dialog
              open={isOpen}
              onOpenChange={(open) => {
                setIsOpen(open)
                if (!open) {
                  setModoEdicion(false)
                  setCategoriaEditando(null)
                  setSubcategorias([])
                  setNuevaSubcategoria("")
                  setAddingSubcategoria(false)
                  setRecienAgregadaId(null)
                  setNuevaCategoria({
                    nombre: "",
                    visible: true,
                    imagen: "/placeholder.svg?height=400&width=400",
                  })
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-[#1e4b8e] hover:bg-transparent hover:text-[#163a70] bg-transparent"
                  onClick={() => {
                    setModoEdicion(false)
                    setCategoriaEditando(null)
                    setIsOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Agregar categoría
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[500px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-medium text-gray-800">
                    {modoEdicion ? "Editar categoría" : "Agregar categoría"}
                  </DialogTitle>
                </DialogHeader>

                <div className="mt-3 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre-categoria" className="text-sm font-medium text-gray-700">
                      Nombre
                    </Label>
                    <Input
                      id="nombre-categoria"
                      placeholder="Ej: Bebidas"
                      value={nuevaCategoria.nombre}
                      onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })}
                      className="bg-gray-50 border-0 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Imagen</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                        <Image
                          src={nuevaCategoria.imagen || "/placeholder.svg?height=400&width=400"}
                          alt="Vista previa"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          id="imagen-categoria"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingImage}
                          onClick={() => document.getElementById("imagen-categoria")?.click()}
                        >
                          {uploadingImage ? "Subiendo..." : "Cambiar imagen"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-700">Visible en la tienda</span>
                    <Switch
                      checked={nuevaCategoria.visible}
                      onCheckedChange={(checked) => setNuevaCategoria({ ...nuevaCategoria, visible: checked })}
                    />
                  </div>

                  {modoEdicion && categoriaEditando && (
                    <div className="space-y-2 border-t border-gray-100 pt-4">
                      <Label className="text-sm font-medium text-gray-700">Subcategorías</Label>
                      {loadingSubcategorias ? (
                        <p className="text-sm text-gray-500">Cargando subcategorías...</p>
                      ) : (
                        <div className="space-y-2">
                          {subcategorias.map((sub) => (
                            <div
                              key={sub.id}
                              className={`flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 transition-all duration-300 ${
                                recienAgregadaId === sub.id
                                  ? "animate-in fade-in slide-in-from-top-2"
                                  : ""
                              }`}
                            >
                              <span className="text-sm text-gray-700">{sub.nombre}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-600"
                                onClick={() => eliminarSubcategoria(sub.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {subcategorias.length === 0 && (
                            <p className="text-sm text-gray-500">Todavía no hay subcategorías.</p>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Input
                          placeholder="Nueva subcategoría"
                          value={nuevaSubcategoria}
                          onChange={(e) => setNuevaSubcategoria(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              agregarSubcategoria()
                            }
                          }}
                          disabled={addingSubcategoria}
                          className="bg-gray-50 border-0 h-10"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={agregarSubcategoria}
                          disabled={addingSubcategoria || nuevaSubcategoria.trim() === ""}
                        >
                          {addingSubcategoria ? "Agregando..." : "Agregar"}
                        </Button>
                      </div>
                      {nuevaSubcategoria.trim() !== "" && (
                        <p className="text-xs text-amber-600">
                          Hacé clic en "Agregar" para guardar la subcategoría antes de continuar.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-10 border-0 bg-gray-50"
                        onClick={() => setIsOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="flex-1 h-10 bg-[#1e4b8e] hover:bg-[#163a70]"
                        disabled={saving || nuevaSubcategoria.trim() !== ""}
                        onClick={modoEdicion ? guardarEdicion : agregarCategoria}
                      >
                        {saving ? "Guardando..." : modoEdicion ? "Guardar" : "Crear"}
                      </Button>
                    </div>
                    {modoEdicion && (
                      <Button
                        variant="ghost"
                        className="h-10 text-red-500 hover:bg-red-50 hover:text-red-600"
                        disabled={saving}
                        onClick={eliminarCategoria}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar categoría
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-500">Cargando categorías...</div>
            </div>
          ) : categorias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              <h2 className="text-lg sm:text-xl font-medium text-gray-700 mb-2 text-center px-4">Sin categorías</h2>
              <p className="text-sm sm:text-base text-gray-500 mb-8 text-center px-4">
                Haz clic en "Agregar categoría" para comenzar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {categorias.map((categoria, index) => {
                const subcategoriasCount = getSubcategoriasCountPorCategoria(categoria.id.toString())

                return (
                  <Card
                    key={categoria.id}
                    className="overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow transition-shadow relative"
                    onClick={() => editarCategoria(categoria.id.toString())}
                  >
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          moverCategoria(categoria.id.toString(), "arriba")
                        }}
                        disabled={index === 0 || reordenandoId !== null}
                        aria-label="Mover categoría antes"
                        className="bg-white/90 text-gray-700 rounded-md p-1.5 shadow-sm hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          moverCategoria(categoria.id.toString(), "abajo")
                        }}
                        disabled={index === categorias.length - 1 || reordenandoId !== null}
                        aria-label="Mover categoría después"
                        className="bg-white/90 text-gray-700 rounded-md p-1.5 shadow-sm hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="relative h-40 sm:h-48 overflow-hidden bg-gray-100">
                      <Image
                        src={categoria.imagen || "/placeholder.svg?height=400&width=400"}
                        alt={categoria.nombre}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src =
                            "/placeholder.svg?height=400&width=400&query=" + encodeURIComponent(categoria.nombre)
                        }}
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-medium text-base sm:text-lg text-gray-800">{categoria.nombre}</h3>
                      {subcategoriasCount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {subcategoriasCount} subcategoría{subcategoriasCount !== 1 ? "s" : ""}
                        </p>
                      )}
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            categoria.visible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {categoria.visible ? "Visible" : "No visible"}
                        </span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
