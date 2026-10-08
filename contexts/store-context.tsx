"use client"

import { createContext, useContext, type ReactNode, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

// Definir tipos para nuestros datos
export interface Categoria {
  id: string
  nombre: string
  imagen: string
  visible: boolean
  orden?: number
}

export interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: string
  imagen: string
  categoria: string
  visible: boolean
  subcategoria?: string
  descuento?: number // added descuento field for discount percentage
  orden?: number
}

export interface MetodoPago {
  id: string
  nombre: string
  activo: boolean
}

export interface FormaEntrega {
  id: string
  nombre: string
  activo: boolean
}

export interface Cupon {
  id: string
  codigo: string
  descuento: number
  tipo: "porcentaje" | "monto"
  fechaInicio: string
  fechaFin: string
  activo: boolean
}

export interface InformacionNegocio {
  nombreTienda: string
  linkTienda: string
  logo: string
  numeroWhatsApp: string
  moneda: string
  ubicacion: string
  sitioWeb: string
  instagram: string
  facebook: string
  twitter: string
  habilitarCupones: boolean
}

export interface HorariosAtencion {
  habilitarPedidosDuranteCierre: boolean
  dias: {
    lunes: boolean
    martes: boolean
    miercoles: boolean
    jueves: boolean
    viernes: boolean
    sabado: boolean
    domingo: boolean
  }
  horario: {
    desde: string
    hasta: string
    desdeAdicional: string
    hastaAdicional: string
  }
}

// Definir el tipo para nuestro contexto
interface StoreContextType {
  categorias: Categoria[]
  setCategorias: (value: Categoria[]) => void
  productos: Producto[]
  setProductos: (value: Producto[]) => void
  metodosPago: MetodoPago[]
  setMetodosPago: (value: MetodoPago[] | ((val: MetodoPago[]) => MetodoPago[])) => void
  formasEntrega: FormaEntrega[]
  setFormasEntrega: (value: FormaEntrega[] | ((val: FormaEntrega[]) => FormaEntrega[])) => void
  cupones: Cupon[]
  setCupones: (value: Cupon[] | ((val: Cupon[]) => Cupon[])) => void
  informacionNegocio: InformacionNegocio
  setInformacionNegocio: (value: InformacionNegocio | ((val: InformacionNegocio) => InformacionNegocio)) => void
  horariosAtencion: HorariosAtencion
  setHorariosAtencion: (value: HorariosAtencion | ((val: HorariosAtencion) => HorariosAtencion)) => void
  loading: boolean
  refetchCategorias: () => Promise<void>
  refetchProductos: () => Promise<void>
}

// Crear el contexto
const StoreContext = createContext<StoreContextType | undefined>(undefined)

// Valores iniciales
const initialInformacionNegocio: InformacionNegocio = {
  nombreTienda: "",
  linkTienda: "",
  logo: "",
  numeroWhatsApp: "",
  moneda: "Peso Argentino (ARS)",
  ubicacion: "",
  sitioWeb: "",
  instagram: "",
  facebook: "",
  twitter: "",
  habilitarCupones: false,
}

const initialHorariosAtencion: HorariosAtencion = {
  habilitarPedidosDuranteCierre: false,
  dias: {
    lunes: true,
    martes: true,
    miercoles: true,
    jueves: true,
    viernes: true,
    sabado: false,
    domingo: false,
  },
  horario: {
    desde: "09:00 a.m.",
    hasta: "06:00 p.m.",
    desdeAdicional: "",
    hastaAdicional: "",
  },
}

// Proveedor del contexto
export function StoreProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isUnauthenticatedRoute = pathname?.startsWith("/backoffice/sign-in") || pathname?.startsWith("/backoffice/setup")
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([
    { id: "1", nombre: "Efectivo", activo: true },
    { id: "2", nombre: "Tarjeta débito/crédito", activo: true },
  ])
  const [formasEntrega, setFormasEntrega] = useState<FormaEntrega[]>([
    { id: "1", nombre: "Consumo en el local", activo: true },
    { id: "2", nombre: "Retiro personalmente", activo: true },
    { id: "3", nombre: "Delivery", activo: true },
  ])
  const [cupones, setCupones] = useState<Cupon[]>([])
  const [informacionNegocio, setInformacionNegocio] = useState<InformacionNegocio>(initialInformacionNegocio)
  const [horariosAtencion, setHorariosAtencion] = useState<HorariosAtencion>(initialHorariosAtencion)
  const [loading, setLoading] = useState(true)

  const refetchCategorias = async () => {
    try {
      const response = await fetch("/api/backoffice/categorias")

      if (response.ok) {
        const data = await response.json()
        setCategorias(data)
      } else {
        const errorText = await response.text()
        console.error("Categorias fetch failed:", response.status, errorText)
      }
    } catch (error) {
      console.error("Error fetching categorias:", error)
    }
  }

  const refetchProductos = async () => {
    try {
      const response = await fetch("/api/backoffice/productos")

      if (response.ok) {
        const data = await response.json()
        setProductos(data)
      } else {
        const errorText = await response.text()
        console.error("Productos fetch failed:", response.status, errorText)
      }
    } catch (error) {
      console.error("Error fetching productos:", error)
    }
  }

  useEffect(() => {
    if (isUnauthenticatedRoute) {
      setLoading(false)
      return
    }
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([refetchCategorias(), refetchProductos()])
      setLoading(false)
    }
    fetchData()
  }, [isUnauthenticatedRoute])

  return (
    <StoreContext.Provider
      value={{
        categorias,
        setCategorias,
        productos,
        setProductos,
        metodosPago,
        setMetodosPago,
        formasEntrega,
        setFormasEntrega,
        cupones,
        setCupones,
        informacionNegocio,
        setInformacionNegocio,
        horariosAtencion,
        setHorariosAtencion,
        loading,
        refetchCategorias,
        refetchProductos,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

// Hook para usar el contexto
export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error("useStore debe ser usado dentro de un StoreProvider")
  }
  return context
}
