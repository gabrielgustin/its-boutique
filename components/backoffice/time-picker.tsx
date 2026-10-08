"use client"

import { useState } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  label: string
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState(value ? Number.parseInt(value.split(":")[0]) : 9)
  const [selectedMinute, setSelectedMinute] = useState(value ? Number.parseInt(value.split(":")[1]) : 0)

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  const handleConfirm = () => {
    const timeString = `${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`
    onChange(timeString)
    setIsOpen(false)
  }

  const formatTime = (time: string) => {
    if (!time) return "Seleccionar hora"
    const [hour, minute] = time.split(":")
    return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal bg-gray-50 border-0 hover:bg-gray-100"
          >
            <Clock className="mr-2 h-4 w-4 text-gray-500" />
            <span className={value ? "text-gray-900" : "text-gray-500"}>{formatTime(value)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <div className="text-center mb-3">
              <p className="text-xs text-gray-500 mb-1">Selecciona la hora</p>
              <div className="text-xl font-bold text-[#1e4b8e]">
                {selectedHour.toString().padStart(2, "0")}:{selectedMinute.toString().padStart(2, "0")}
              </div>
            </div>

            <div className="flex gap-3">
              {/* Hours */}
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1 text-center">Horas</p>
                <div className="h-32 w-16 overflow-y-auto border rounded-lg">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => setSelectedHour(hour)}
                      className={`w-full px-2 py-1 text-xs hover:bg-gray-100 transition-colors ${
                        selectedHour === hour ? "bg-[#1e4b8e] text-white hover:bg-[#163a70]" : "text-gray-700"
                      }`}
                    >
                      {hour.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes */}
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1 text-center">Minutos</p>
                <div className="h-32 w-16 overflow-y-auto border rounded-lg">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      onClick={() => setSelectedMinute(minute)}
                      className={`w-full px-2 py-1 text-xs hover:bg-gray-100 transition-colors ${
                        selectedMinute === minute ? "bg-[#1e4b8e] text-white hover:bg-[#163a70]" : "text-gray-700"
                      }`}
                    >
                      {minute.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent text-xs"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button size="sm" className="flex-1 bg-[#1e4b8e] hover:bg-[#163a70] text-xs" onClick={handleConfirm}>
                Confirmar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
