"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Home, Grid3X3, Briefcase, Plus, Trash2, X, Pencil, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useStore, type Producto } from "@/contexts/store-context"
import { useToast } from "@/hooks/use-toast"
import { PreviewButton } from "@/components/backoffice/preview-button"
import { SignOutButton } from "@/components/backoffice/sign-out-button"
import { uploadBackofficeImage } from "@/lib/backoffice-image-upload"
import { cleanDiscount, formatPrice, unitPrice } from "@/lib/pricing"
import { ExtraImages } from "@/components/backoffice/extra-images"

// Valor de la opción «Ninguna» de los selectores (el selector no admite un valor vacío).
const NINGUNA = "__ninguna__"

interface Subcategoria {
  id: string
  nombre: string
  categoria_id: string
}

export default function ProductosPage() {
  const { productos, categorias, setProductos, refetchProductos, loading } = useStore()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [reordenandoId, setReordenandoId] = useState<string | null>(null)
  const [variantes, setVariantes] = useState<Array<{ nombre: string; precio: string }>>([])
  const [nuevoProducto, setNuevoProducto] = useState<Omit<Producto, "id">>({
    nombre: "",
    descripcion: "",
    precio: "",
    imagen: "/placeholder.svg?height=400&width=400",
    categoria: "",
    visible: true,
    subcategoria: "",
    descuento: 0,
  })

  const [modoEdicion, setModoEdicion] = useState(false)
  const [productoEditando, setProductoEditando] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [filtroSubcategoria, setFiltroSubcategoria] = useState<string>("todos")
  const [agregandoSubcategoria, setAgregandoSubcategoria] = useState<string | null>(null)
  const [nuevaSubcategoriaNombre, setNuevaSubcategoriaNombre] = useState("")
  const [editandoSubcategoria, setEditandoSubcategoria] = useState<string | null>(null)
  const [nuevoNombreSubcategoria, setNuevoNombreSubcategoria] = useState("")
  const [subcategoriaAEliminar, setSubcategoriaAEliminar] = useState<string | null>(null)
  const [creandoSubcategoriaEnSelector, setCreandoSubcategoriaEnSelector] = useState(false)
  const [nombreNuevaSubcategoriaSelector, setNombreNuevaSubcategoriaSelector] = useState("")
  const [creandoSubcategoriaSelectorSaving, setCreandoSubcategoriaSelectorSaving] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && menuOpen) {
        setMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [menuOpen])

  useEffect(() => {
    fetchSubcategorias()
  }, [])

  const fetchSubcategorias = async () => {
    try {
      const response = await fetch("/api/backoffice/subcategorias")
      if (response.ok) {
        const data = await response.json()
        setSubcategorias(data)
      }
    } catch (error) {
      console.error("Error fetching subcategorias:", error)
    }
  }

  const editarProducto = async (id: string) => {
    const producto = productos.find((prod) => prod.id === id)
    if (producto) {
      // Cada producto tiene sus propias variantes: se cargan las de este, no las de otro.
      setVariantes([])
      try {
        const response = await fetch(`/api/backoffice/productos/${id}/variantes`)
        if (response.ok) {
          const data = (await response.json()) as Array<{ nombre: string; precio: number | string }>
          setVariantes(data.map((variante) => ({ nombre: variante.nombre, precio: String(variante.precio) })))
        }
      } catch (error) {
        console.error("Error cargando las variantes:", error)
      }
      setNuevoProducto({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        imagen: producto.imagen,
        categoria: producto.categoria,
        visible: producto.visible,
        subcategoria: producto.subcategoria || "",
        descuento: producto.descuento || 0,
      })
      setProductoEditando(id)
      setModoEdicion(true)
      setIsOpen(true)
    }
  }

  const guardarEdicion = async () => {
    if (!productoEditando) return

    if (nuevoProducto.nombre.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre del producto es obligatorio",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/backoffice/productos/${productoEditando}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoProducto,
          variantes,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar producto")
      }

      await refetchProductos()
      setNuevoProducto({
        nombre: "",
        descripcion: "",
        precio: "",
        imagen: "/placeholder.svg?height=400&width=400",
        categoria: "",
        visible: true,
        subcategoria: "",
        descuento: 0,
      })
      setModoEdicion(false)
      setProductoEditando(null)
      setIsOpen(false)

      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const agregarProducto = async () => {
    if (nuevoProducto.nombre.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre del producto es obligatorio",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/backoffice/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoProducto,
          variantes,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear producto")
      }

      await refetchProductos()
      setNuevoProducto({
        nombre: "",
        descripcion: "",
        precio: "",
        imagen: "/placeholder.svg?height=400&width=400",
        categoria: "",
        visible: true,
        subcategoria: "",
        descuento: 0,
      })
      setIsOpen(false)

      toast({
        title: "Producto agregado",
        description: "El producto ha sido agregado correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el producto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const eliminarProducto = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const response = await fetch(`/api/backoffice/productos/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar producto")
      }

      await refetchProductos()

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      })
    }
  }

  const eliminarProductoDesdeDialogo = async () => {
    if (!productoEditando) return

    setSaving(true)
    try {
      const response = await fetch(`/api/backoffice/productos/${productoEditando}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar producto")
      }

      await refetchProductos()
      setModoEdicion(false)
      setProductoEditando(null)
      setIsOpen(false)

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const url = await uploadBackofficeImage(file)
      setNuevoProducto({ ...nuevoProducto, imagen: url })

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

  const moverProducto = async (
    categoriaId: string,
    productosCategoria: Producto[],
    productoId: string,
    direccion: "arriba" | "abajo",
  ) => {
    const index = productosCategoria.findIndex((prod) => prod.id === productoId)
    const nuevoIndex = direccion === "arriba" ? index - 1 : index + 1

    if (index === -1 || nuevoIndex < 0 || nuevoIndex >= productosCategoria.length) return

    const reordenados = [...productosCategoria]
    const [movido] = reordenados.splice(index, 1)
    reordenados.splice(nuevoIndex, 0, movido)

    // Reemplazar únicamente las posiciones de esta categoría, en su nuevo orden,
    // sin mover el resto de las categorías dentro de la lista general.
    let cursor = 0
    const nuevaLista = productos.map((prod) =>
      prod.categoria === categoriaId ? reordenados[cursor++] : prod,
    )

    setReordenandoId(String(productoId))
    setProductos(nuevaLista)

    try {
      const response = await fetch("/api/backoffice/productos/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoriaId, ids: reordenados.map((prod) => prod.id) }),
      })

      if (!response.ok) throw new Error("Error al reordenar")
    } catch (error) {
      console.error("Error reordering productos:", error)
      toast({
        title: "Error",
        description: "No se pudo reordenar el producto",
        variant: "destructive",
      })
      await refetchProductos()
    } finally {
      setReordenandoId(null)
    }
  }

  const productosPorCategoria = productos.reduce(
    (acc, producto) => {
      const categoriaId = producto.categoria || "sin-categoria"
      const categoriaObj = categorias.find((cat) => cat.id === categoriaId)
      const categoriaNombre = categoriaObj?.nombre || "Sin categoría"

      if (!acc[categoriaNombre]) {
        acc[categoriaNombre] = []
      }
      acc[categoriaNombre].push(producto)
      return acc
    },
    {} as Record<string, Producto[]>,
  )

  // Mueve una subcategoría un lugar a la izquierda o a la derecha dentro de su categoría.
  const moverSubcategoria = async (categoriaId: string, delCategoria: Subcategoria[], subcategoriaId: string, direccion: "antes" | "despues") => {
    const index = delCategoria.findIndex((sub) => sub.id === subcategoriaId)
    const nuevoIndex = direccion === "antes" ? index - 1 : index + 1
    if (index === -1 || nuevoIndex < 0 || nuevoIndex >= delCategoria.length) return

    const reordenadas = [...delCategoria]
    const [movida] = reordenadas.splice(index, 1)
    reordenadas.splice(nuevoIndex, 0, movida)

    // Se reemplazan solo las posiciones de esta categoría, sin mover las de las demás.
    let cursor = 0
    setSubcategorias(subcategorias.map((sub) => (sub.categoria_id === categoriaId ? reordenadas[cursor++] : sub)))

    try {
      const response = await fetch("/api/backoffice/subcategorias/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoriaId, ids: reordenadas.map((sub) => sub.id) }),
      })
      if (!response.ok) throw new Error("Error al reordenar")
    } catch (error) {
      console.error("Error reordering subcategorias:", error)
      toast({ title: "Error", description: "No se pudo reordenar la subcategoría", variant: "destructive" })
      await fetchSubcategorias()
    }
  }

  const crearSubcategoria = async (categoriaId: string) => {
    if (nuevaSubcategoriaNombre.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre de la subcategoría es obligatorio",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/backoffice/subcategorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevaSubcategoriaNombre,
          categoria_id: categoriaId,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear subcategoría")
      }

      await fetchSubcategorias()
      setNuevaSubcategoriaNombre("")
      setAgregandoSubcategoria(null)

      toast({
        title: "Subcategoría agregada",
        description: "La subcategoría ha sido agregada correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar la subcategoría",
        variant: "destructive",
      })
    }
  }

  const crearSubcategoriaDesdeSelector = async () => {
    if (nombreNuevaSubcategoriaSelector.trim() === "" || !nuevoProducto.categoria) {
      toast({
        title: "Error",
        description: "El nombre de la subcategoría es obligatorio",
        variant: "destructive",
      })
      return
    }

    setCreandoSubcategoriaSelectorSaving(true)
    try {
      const response = await fetch("/api/backoffice/subcategorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreNuevaSubcategoriaSelector,
          categoria_id: nuevoProducto.categoria,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear subcategoría")
      }

      const nuevaSubcategoria = await response.json()
      await fetchSubcategorias()
      setNuevoProducto((prev) => ({ ...prev, subcategoria: nuevaSubcategoria.id }))
      setNombreNuevaSubcategoriaSelector("")
      setCreandoSubcategoriaEnSelector(false)

      const categoriaNombre = categorias.find((cat) => cat.id === nuevoProducto.categoria)?.nombre
      toast({
        title: "Subcategoría agregada",
        description: categoriaNombre
          ? `Se vinculó automáticamente a "${categoriaNombre}"`
          : "La subcategoría ha sido agregada correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar la subcategoría",
        variant: "destructive",
      })
    } finally {
      setCreandoSubcategoriaSelectorSaving(false)
    }
  }

  const editarSubcategoria = async (subcategoriaId: string) => {
    if (nuevoNombreSubcategoria.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/backoffice/subcategorias?id=${subcategoriaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombreSubcategoria }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar subcategoría")
      }

      await fetchSubcategorias()
      setEditandoSubcategoria(null)
      setNuevoNombreSubcategoria("")

      toast({
        title: "Subcategoría actualizada",
        description: "La subcategoría ha sido actualizada correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la subcategoría",
        variant: "destructive",
      })
    }
  }

  const eliminarSubcategoria = async (subcategoriaId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    setSubcategoriaAEliminar(subcategoriaId)
  }

  const confirmarEliminacionSubcategoria = async () => {
    if (!subcategoriaAEliminar) return

    try {
      const response = await fetch(`/api/backoffice/subcategorias?id=${subcategoriaAEliminar}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar subcategoría")
      }

      await fetchSubcategorias()
      if (filtroSubcategoria === subcategoriaAEliminar) {
        setFiltroSubcategoria("todos")
      }

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
    } finally {
      setSubcategoriaAEliminar(null)
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
            className={`${menuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative top-0 left-0 w-[280px] md:w-auto h-full md:h-auto bg-[#1e4b8e] text-white p-6 rounded-none md:rounded-lg z-50 md:z-0 transition-transform duration-300 ease-in-out`}
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

              <Link href="/backoffice/categorias" className="flex items-center hover:underline" onClick={() => setMenuOpen(false)}>
                <Grid3X3 className="h-5 w-5 mr-4" />
                Categorías
              </Link>

              <Link
                href="/backoffice/productos"
                className="flex items-center hover:underline font-semibold"
                onClick={() => setMenuOpen(false)}
              >
                <Briefcase className="h-5 w-5 mr-4" />
                Productos
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Productos</h1>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-[#1e4b8e] hover:bg-transparent hover:text-[#163a70] bg-transparent"
                  onClick={() => {
                    setNuevoProducto({
                      nombre: "",
                      descripcion: "",
                      precio: "",
                      imagen: "/placeholder.svg?height=400&width=400",
                      categoria: "",
                      visible: true,
                      subcategoria: "",
                      descuento: 0,
                    })
                    setVariantes([])
                    setModoEdicion(false)
                    setProductoEditando(null)
                    setIsOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Agregar producto
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[500px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-medium text-gray-800">
                    {modoEdicion ? "Editar producto" : "Agregar producto"}
                  </DialogTitle>
                </DialogHeader>

                <div className="mt-3 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre-producto" className="text-sm font-medium text-gray-700">
                      Nombre
                    </Label>
                    <Input
                      id="nombre-producto"
                      placeholder="Ej: Hamburguesa clásica"
                      value={nuevoProducto.nombre}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                      className="bg-gray-50 border-0 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="descripcion-producto" className="text-sm font-medium text-gray-700">
                      Descripción
                    </Label>
                    <Textarea
                      id="descripcion-producto"
                      placeholder="Describe el producto"
                      value={nuevoProducto.descripcion}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })}
                      className="bg-gray-50 border-0 min-h-20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Precio</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={nuevoProducto.precio}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })}
                        className="bg-gray-50 border-0 h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="descuento-producto" className="text-sm font-medium text-gray-700">
                        Descuento (%)
                      </Label>
                      <Input
                        id="descuento-producto"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="0"
                        value={nuevoProducto.descuento || ""}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, descuento: cleanDiscount(e.target.value) })}
                        className="bg-gray-50 border-0 h-10"
                      />
                    </div>
                  </div>
                  {(nuevoProducto.descuento ?? 0) > 0 && Number(nuevoProducto.precio) > 0 && (
                    <p className="-mt-1 text-xs text-gray-600">
                      Precio final en la tienda:{" "}
                      <span className="font-semibold text-[#1e4b8e]">{formatPrice(unitPrice(Number(nuevoProducto.precio), nuevoProducto.descuento))}</span>{" "}
                      <span className="text-gray-400 line-through">{formatPrice(Number(nuevoProducto.precio))}</span>
                      {variantes.length > 0 ? " · También se aplica a las variantes." : ""}
                    </p>
                  )}

                  <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Variantes (talles, colores…)</Label>
                        <p className="text-xs text-gray-500">Opcional: nombre y precio de cada variante.</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setVariantes([...variantes, { nombre: "", precio: nuevoProducto.precio || "0" }])}>
                        <Plus className="mr-1 h-3 w-3" /> Agregar
                      </Button>
                    </div>
                    {variantes.map((variante, index) => (
                      <div key={index} className="grid grid-cols-[1fr_110px_auto] gap-2 items-end">
                        <Input placeholder="Nombre" value={variante.nombre} onChange={(e) => setVariantes(variantes.map((v, i) => i === index ? { ...v, nombre: e.target.value } : v))} />
                        <Input type="number" min="0" placeholder="Precio" value={variante.precio} onChange={(e) => setVariantes(variantes.map((v, i) => i === index ? { ...v, precio: e.target.value } : v))} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setVariantes(variantes.filter((_, i) => i !== index))} aria-label="Eliminar variante"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    ))}
                    {variantes.length === 0 && <p className="text-xs text-gray-500">Sin variantes: el producto usará su precio base.</p>}
                  </div>

                  {modoEdicion && productoEditando ? (
                    <ExtraImages productId={productoEditando} />
                  ) : (
                    <p className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-500">Después de crear el producto vas a poder sumarle más fotos.</p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Categoría</Label>
                      <Select
                        value={nuevoProducto.categoria}
                        onValueChange={(value) => {
                          setNuevoProducto({ ...nuevoProducto, categoria: value === NINGUNA ? "" : value, subcategoria: "" })
                          setCreandoSubcategoriaEnSelector(false)
                          setNombreNuevaSubcategoriaSelector("")
                        }}
                      >
                        <SelectTrigger className="bg-gray-50 border-0 h-10">
                          <SelectValue placeholder="Ninguna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NINGUNA}>Ninguna</SelectItem>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Subcategoría</Label>
                      <Select
                        value={nuevoProducto.subcategoria || ""}
                        onValueChange={(value) => {
                          if (value === "__nueva__") {
                            setCreandoSubcategoriaEnSelector(true)
                            return
                          }
                          setNuevoProducto({ ...nuevoProducto, subcategoria: value === NINGUNA ? "" : value })
                        }}
                        disabled={!nuevoProducto.categoria}
                      >
                        <SelectTrigger className="bg-gray-50 border-0 h-10">
                          <SelectValue placeholder="Ninguna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NINGUNA}>Ninguna</SelectItem>
                          {subcategorias
                            .filter((sub) => sub.categoria_id === nuevoProducto.categoria)
                            .map((sub) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.nombre}
                              </SelectItem>
                            ))}
                          <SelectItem value="__nueva__" className="text-[#1e4b8e] font-medium">
                            + Agregar subcategoría
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {creandoSubcategoriaEnSelector && (
                        <div className="flex items-center gap-2 pt-1">
                          <Input
                            autoFocus
                            placeholder="Nombre de la subcategoría"
                            value={nombreNuevaSubcategoriaSelector}
                            onChange={(e) => setNombreNuevaSubcategoriaSelector(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                crearSubcategoriaDesdeSelector()
                              }
                            }}
                            className="bg-gray-50 border-0 h-9 text-sm"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 bg-[#1e4b8e] hover:bg-[#163a70]"
                            disabled={creandoSubcategoriaSelectorSaving}
                            onClick={crearSubcategoriaDesdeSelector}
                          >
                            {creandoSubcategoriaSelectorSaving ? "..." : "Agregar"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-9"
                            onClick={() => {
                              setCreandoSubcategoriaEnSelector(false)
                              setNombreNuevaSubcategoriaSelector("")
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Imagen</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                        <Image
                          src={nuevoProducto.imagen || "/placeholder.svg?height=400&width=400"}
                          alt="Vista previa"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          id="imagen-producto"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingImage}
                          onClick={() => document.getElementById("imagen-producto")?.click()}
                        >
                          {uploadingImage ? "Subiendo..." : "Cambiar imagen"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-700">Visible en la tienda</span>
                    <Switch
                      checked={nuevoProducto.visible}
                      onCheckedChange={(checked) => setNuevoProducto({ ...nuevoProducto, visible: checked })}
                    />
                  </div>

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
                        disabled={saving}
                        onClick={modoEdicion ? guardarEdicion : agregarProducto}
                      >
                        {saving ? "Guardando..." : modoEdicion ? "Guardar" : "Crear"}
                      </Button>
                    </div>
                    {modoEdicion && (
                      <Button
                        variant="ghost"
                        className="h-10 text-red-500 hover:bg-red-50 hover:text-red-600"
                        disabled={saving}
                        onClick={eliminarProductoDesdeDialogo}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar producto
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-500">Cargando productos...</div>
            </div>
          ) : productos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              <h2 className="text-lg sm:text-xl font-medium text-gray-700 mb-2 text-center px-4">Sin productos</h2>
              <p className="text-sm sm:text-base text-gray-500 mb-8 text-center px-4">
                Haz clic en "Agregar producto" para comenzar
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(productosPorCategoria).map(([categoria, productosCategoria]) => {
                const categoriaId = categorias.find((c) => c.nombre === categoria)?.id
                const subcategoriasCategoria = subcategorias.filter((s) => s.categoria_id === categoriaId)

                const productosFiltrados =
                  filtroSubcategoria === "todos"
                    ? productosCategoria
                    : productosCategoria.filter((p) => p.subcategoria === filtroSubcategoria)

                return (
                  <div key={categoria}>
                    <h2 className="text-lg font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-[#1e4b8e]">
                      {categoria}
                    </h2>

                    <div className="flex flex-wrap gap-2 mb-4 mt-3">
                      <button
                        onClick={() => setFiltroSubcategoria("todos")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          filtroSubcategoria === "todos"
                            ? "bg-[#1e4b8e] text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        Todos
                      </button>
                      {subcategoriasCategoria.map((sub) => (
                        <div key={sub.id} className="relative group">
                          {editandoSubcategoria === sub.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={nuevoNombreSubcategoria}
                                onChange={(e) => setNuevoNombreSubcategoria(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    editarSubcategoria(sub.id)
                                  }
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4b8e]"
                                autoFocus
                              />
                              <button
                                onClick={() => editarSubcategoria(sub.id)}
                                className="px-3 py-2 bg-[#1e4b8e] text-white rounded-full text-sm hover:bg-[#163a70] transition-colors"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => {
                                  setEditandoSubcategoria(null)
                                  setNuevoNombreSubcategoria("")
                                }}
                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setFiltroSubcategoria(sub.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                  filtroSubcategoria === sub.id
                                    ? "bg-[#1e4b8e] text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                {sub.nombre}
                              </button>
                            </>
                          )}
                        </div>
                      ))}

                      {categoriaId && (
                        <>
                          {agregandoSubcategoria === categoriaId ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={nuevaSubcategoriaNombre}
                                onChange={(e) => setNuevaSubcategoriaNombre(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    crearSubcategoria(categoriaId)
                                  }
                                }}
                                placeholder="Nueva subcategoría"
                                className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4b8e]"
                                autoFocus
                              />
                              <button
                                onClick={() => crearSubcategoria(categoriaId)}
                                className="px-3 py-2 bg-[#1e4b8e] text-white rounded-full text-sm hover:bg-[#163a70] transition-colors"
                              >
                                Agregar
                              </button>
                              <button
                                onClick={() => {
                                  setAgregandoSubcategoria(null)
                                  setNuevaSubcategoriaNombre("")
                                }}
                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAgregandoSubcategoria(categoriaId)}
                              className="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-dashed border-gray-300"
                            >
                              + Agregar subcategoría
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {(() => {
                      const index = subcategoriasCategoria.findIndex((sub) => sub.id === filtroSubcategoria)
                      const elegida = index >= 0 ? subcategoriasCategoria[index] : null
                      if (!elegida || editandoSubcategoria === elegida.id) return null
                      const boton = "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      return (
                        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2" role="group" aria-label={`Opciones de la subcategoría ${elegida.nombre}`}>
                          <span className="px-1 text-sm text-gray-600">
                            Subcategoría <strong className="text-gray-800">{elegida.nombre}</strong>
                          </span>
                          <button type="button" onClick={() => moverSubcategoria(categoriaId ?? "", subcategoriasCategoria, elegida.id, "antes")} disabled={index === 0} className={`${boton} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`}>
                            <ChevronLeft className="h-4 w-4" /> Mover
                          </button>
                          <button type="button" onClick={() => moverSubcategoria(categoriaId ?? "", subcategoriasCategoria, elegida.id, "despues")} disabled={index === subcategoriasCategoria.length - 1} className={`${boton} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`}>
                            Mover <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditandoSubcategoria(elegida.id)
                              setNuevoNombreSubcategoria(elegida.nombre)
                            }}
                            className={`${boton} border-blue-200 bg-white text-blue-700 hover:bg-blue-50`}
                          >
                            <Pencil className="h-4 w-4" /> Editar nombre
                          </button>
                          <button type="button" onClick={(e) => eliminarSubcategoria(elegida.id, e)} className={`${boton} border-red-200 bg-white text-red-600 hover:bg-red-50`}>
                            <Trash2 className="h-4 w-4" /> Eliminar
                          </button>
                        </div>
                      )
                    })()}

                    {filtroSubcategoria !== "todos" && (
                      <p className="text-xs text-gray-500 mb-3 -mt-1">
                        El orden de los productos solo se puede editar con el filtro "Todos" seleccionado.
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {productosFiltrados.map((producto, prodIndex) => (
                        <Card
                          key={producto.id}
                          className="overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow transition-shadow relative group"
                          onClick={() => editarProducto(producto.id)}
                        >
                          {filtroSubcategoria === "todos" && categoriaId && (
                            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moverProducto(categoriaId, productosCategoria, producto.id, "arriba")
                                }}
                                disabled={prodIndex === 0 || reordenandoId !== null}
                                aria-label="Mover producto antes"
                                className="bg-white/90 text-gray-700 rounded-md p-1.5 shadow-sm hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moverProducto(categoriaId, productosCategoria, producto.id, "abajo")
                                }}
                                disabled={prodIndex === productosFiltrados.length - 1 || reordenandoId !== null}
                                aria-label="Mover producto después"
                                className="bg-white/90 text-gray-700 rounded-md p-1.5 shadow-sm hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                            onClick={(e) => eliminarProducto(producto.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="aspect-square relative">
                            <Image
                              src={producto.imagen || "/placeholder.svg"}
                              alt={producto.nombre}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold mb-1 text-gray-800">{producto.nombre}</h3>
                            {producto.subcategoria && (
                              <p className="text-xs text-gray-500 mb-2">
                                {subcategorias.find((s) => s.id === producto.subcategoria)?.nombre ||
                                  producto.subcategoria}
                              </p>
                            )}

                            {producto.descuento && producto.descuento > 0 ? (
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-800">
                                  $
                                  {(Number.parseFloat(producto.precio || "0") * (1 - producto.descuento / 100)).toFixed(
                                    2,
                                  )}
                                </p>
                                <p className="text-sm text-gray-400 line-through">${producto.precio}</p>
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                  -{producto.descuento}%
                                </span>
                              </div>
                            ) : (
                              <p className="font-medium text-gray-800">${producto.precio}</p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
