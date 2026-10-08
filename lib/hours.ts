// Horarios de atención: lógica pura, sin base de datos (se puede probar sola).

export interface BusinessHours {
  id: number
  day_of_week: string
  open_time: string
  close_time: string
  additional_open_time?: string | null
  additional_close_time?: string | null
  is_open: boolean
}

// El servidor suele correr en UTC: la hora se calcula siempre en la zona del negocio.
const TIME_ZONE = process.env.STORE_TIME_ZONE || "America/Argentina/Buenos_Aires"

function toMinutes(time: string | null | undefined): number | null {
  if (!time) return null
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(time.trim())
  if (!match) return null
  let hours = Number(match[1])
  const period = match[3]?.toUpperCase()
  if (period === "PM" && hours !== 12) hours += 12
  if (period === "AM" && hours === 12) hours = 0
  return hours * 60 + Number(match[2])
}

export function isOpenAt(hours: BusinessHours[], now: Date): boolean {
  const parts = new Intl.DateTimeFormat("es-AR", { timeZone: TIME_ZONE, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now)
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? ""
  const today = part("weekday").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  const minutes = Number(part("hour")) * 60 + Number(part("minute"))

  const day = hours.find((entry) => entry.day_of_week.toLowerCase() === today)
  if (!day?.is_open) return false

  const within = (from: number | null, to: number | null) => from !== null && to !== null && minutes >= from && minutes <= to
  return (
    within(toMinutes(day.open_time), toMinutes(day.close_time)) ||
    within(toMinutes(day.additional_open_time), toMinutes(day.additional_close_time))
  )
}
