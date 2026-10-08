"use client"

import { useState, useEffect } from "react"
import { MapPin, Search, ExternalLink, Loader2, Navigation } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface GoogleMapsPickerProps {
  value: string
  onChange: (address: string, lat?: number, lng?: number) => void
  placeholder?: string
}

export function GoogleMapsPicker({ value, onChange, placeholder = "Buscar dirección..." }: GoogleMapsPickerProps) {
  const [searchValue, setSearchValue] = useState(value)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  useEffect(() => {
    setSearchValue(value)
  }, [value])

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización")
      return
    }

    setIsLoadingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // Use Nominatim (OpenStreetMap) for reverse geocoding - it's free and doesn't require API key
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`,
          )

          if (!response.ok) {
            throw new Error("Error al obtener la dirección")
          }

          const data = await response.json()

          // Build a readable address from the response
          const address = data.display_name || `${latitude}, ${longitude}`

          setSearchValue(address)
          onChange(address, latitude, longitude)
        } catch (error) {
          console.error("Error al obtener dirección:", error)
          // Fallback to coordinates if reverse geocoding fails
          const coordsAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          setSearchValue(coordsAddress)
          onChange(coordsAddress, latitude, longitude)
        } finally {
          setIsLoadingLocation(false)
        }
      },
      (error) => {
        console.error("Error al obtener ubicación:", error)
        alert("No se pudo obtener tu ubicación. Por favor, verifica los permisos de ubicación.")
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const openGoogleMaps = () => {
    const query = encodeURIComponent(searchValue || "Argentina")
    window.open(`https://www.google.com/maps/search/${query}`, "_blank")
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onBlur={() => {
            if (searchValue !== value) {
              onChange(searchValue)
            }
          }}
          className="bg-gray-50 border-0 pr-10"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          className="bg-green-600 text-white hover:bg-green-700 hover:text-white w-full sm:w-auto"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          Mi ubicación
        </Button>

        <Button
          type="button"
          variant="outline"
          className="bg-[#1e4b8e] text-white hover:bg-[#163a70] hover:text-white w-full sm:w-auto"
          onClick={openGoogleMaps}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Ver en mapa
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        Haz clic en "Mi ubicación" para detectar automáticamente tu dirección, o ingresa la dirección manualmente.
        También puedes buscar en Google Maps y copiar la dirección exacta.
      </p>
    </div>
  )
}
