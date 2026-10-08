"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { PreviewButton } from "@/components/backoffice/preview-button"
import { SignOutButton } from "@/components/backoffice/sign-out-button"
import { useToast } from "@/hooks/use-toast"
import { TimePicker } from "@/components/backoffice/time-picker"

export default function HorariosAtencionPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    dias: {
      lunes: false,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false,
      domingo: false,
    },
    horario: {
      desde: "",
      hasta: "",
    },
    habilitarPedidosDuranteCierre: false,
  })

  useEffect(() => {
    const fetchBusinessHours = async () => {
      try {
        const response = await fetch("/api/backoffice/business-hours")
        if (response.ok) {
          const result = await response.json()

          if (result.success && result.data?.hours) {
            const hours = result.data.hours
            const config = result.data.config || {}

            const diasMap: (typeof formData)["dias"] & Record<string, boolean> = {
              lunes: false,
              martes: false,
              miercoles: false,
              jueves: false,
              viernes: false,
              sabado: false,
              domingo: false,
            }

            const convert12to24 = (time12h: string | null): string => {
              if (!time12h) return ""
              const [time, period] = time12h.split(" ")
              let [hours, minutes] = time.split(":").map(Number)

              if (period === "PM" && hours !== 12) hours += 12
              if (period === "AM" && hours === 12) hours = 0

              return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
            }

            let mainStart = ""
            let mainEnd = ""

            hours.forEach((day: any) => {
              const dayName = day.day_of_week.toLowerCase()
              if (dayName in diasMap) {
                diasMap[dayName] = day.is_open || false

                if (!mainStart && day.open_time) {
                  mainStart = convert12to24(day.open_time)
                  mainEnd = convert12to24(day.close_time)
                }
              }
            })

            setFormData({
              dias: diasMap,
              horario: {
                desde: mainStart,
                hasta: mainEnd,
              },
              habilitarPedidosDuranteCierre: config.allow_orders_when_closed || false,
            })
          }
        }
      } catch (error) {
        console.error("Error fetching business hours:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBusinessHours()
  }, [])

  const handleDiaChange = (dia: string) => {
    setFormData({
      ...formData,
      dias: {
        ...formData.dias,
        [dia]: !formData.dias[dia as keyof typeof formData.dias],
      },
    })
  }

  const handleHorarioChange = (campo: string, valor: string) => {
    setFormData({
      ...formData,
      horario: {
        ...formData.horario,
        [campo]: valor,
      },
    })
  }

  const handleSubmit = async () => {

    const hayDiaSeleccionado = Object.values(formData.dias).some((dia) => dia)

    if (!hayDiaSeleccionado) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un día de atención",
        variant: "destructive",
      })
      return
    }

    if (!formData.horario.desde || !formData.horario.hasta) {
      toast({
        title: "Error",
        description: "Debes completar los horarios de atención",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const convert24to12 = (time24: string): string => {
        if (!time24) return ""
        const [hours, minutes] = time24.split(":").map(Number)
        const period = hours >= 12 ? "PM" : "AM"
        const hour12 = hours % 12 || 12
        return `${hour12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`
      }

      const mainStart = convert24to12(formData.horario.desde)
      const mainEnd = convert24to12(formData.horario.hasta)

      const days = [
        { day_of_week: "lunes", is_open: formData.dias.lunes },
        { day_of_week: "martes", is_open: formData.dias.martes },
        { day_of_week: "miercoles", is_open: formData.dias.miercoles },
        { day_of_week: "jueves", is_open: formData.dias.jueves },
        { day_of_week: "viernes", is_open: formData.dias.viernes },
        { day_of_week: "sabado", is_open: formData.dias.sabado },
        { day_of_week: "domingo", is_open: formData.dias.domingo },
      ]

      const businessHoursData = {
        hours: days.map((day) => ({
          ...day,
          open_time: day.is_open ? mainStart : null,
          close_time: day.is_open ? mainEnd : null,
          additional_open_time: null,
          additional_close_time: null,
        })),
        allow_orders_when_closed: formData.habilitarPedidosDuranteCierre,
      }


      const response = await fetch("/api/backoffice/business-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessHoursData),
      })

      if (!response.ok) {
        throw new Error("Error al guardar los horarios")
      }


      toast({
        title: "Horarios guardados",
        description: "Los horarios de atención han sido guardados correctamente",
      })

      setTimeout(() => router.push("/backoffice"), 1000)
    } catch (error) {
      console.error("Error saving business hours:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar los horarios. Intenta nuevamente.",
        variant: "destructive",
      })
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e4b8e]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-[#1e4b8e] text-white">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/backoffice" className="text-white hover:text-gray-200">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-medium text-white">Horarios de atención</h1>
          </div>
          <div className="flex items-center gap-1">
            <PreviewButton />
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Habilitar pedidos durante cierre</h3>
              <p className="text-xs text-gray-500 mt-1">
                Habilita esta opción si quieres recibir pedidos fuera de tu horario laboral
              </p>
            </div>
            <Switch
              checked={formData.habilitarPedidosDuranteCierre}
              onCheckedChange={(checked) => setFormData({ ...formData, habilitarPedidosDuranteCierre: checked })}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-base font-medium text-gray-800 mb-4">Días de atención</h2>
            <div className="flex flex-wrap gap-4">
              {Object.entries({
                lunes: "Lunes",
                martes: "Martes",
                miercoles: "Miércoles",
                jueves: "Jueves",
                viernes: "Viernes",
                sabado: "Sábado",
                domingo: "Domingo",
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={formData.dias[key as keyof typeof formData.dias]}
                    onCheckedChange={() => handleDiaChange(key)}
                  />
                  <label htmlFor={key} className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-base font-medium text-gray-800 mb-4">Horario de atención</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimePicker
                label="Desde"
                value={formData.horario.desde}
                onChange={(value) => handleHorarioChange("desde", value)}
              />
              <TimePicker
                label="Hasta"
                value={formData.horario.hasta}
                onChange={(value) => handleHorarioChange("hasta", value)}
              />
            </div>
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
