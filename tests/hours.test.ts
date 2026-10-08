import { describe, expect, it } from "vitest"
import { isOpenAt, type BusinessHours } from "@/lib/hours"

const day = (day_of_week: string, extra: Partial<BusinessHours> = {}): BusinessHours => ({ id: 1, day_of_week, is_open: true, open_time: "09:00", close_time: "13:00", ...extra })

// 8 de octubre de 2026 es jueves. Buenos Aires está en UTC-3.
const at = (time: string) => new Date(`2026-10-08T${time}:00-03:00`)

describe("isOpenAt", () => {
  it("abierto dentro del horario, en la hora del negocio y no la del servidor", () => {
    expect(isOpenAt([day("jueves")], at("10:30"))).toBe(true)
    expect(isOpenAt([day("jueves")], at("08:59"))).toBe(false)
    expect(isOpenAt([day("jueves")], at("13:01"))).toBe(false)
  })
  it("respeta el segundo turno", () => {
    const hours = [day("jueves", { additional_open_time: "17:00", additional_close_time: "20:30" })]
    expect(isOpenAt(hours, at("15:00"))).toBe(false)
    expect(isOpenAt(hours, at("18:00"))).toBe(true)
  })
  it("cerrado si el día está marcado como cerrado o no existe", () => {
    expect(isOpenAt([day("jueves", { is_open: false })], at("10:30"))).toBe(false)
    expect(isOpenAt([day("viernes")], at("10:30"))).toBe(false)
  })
  it("acepta horas en formato 12 h", () => {
    expect(isOpenAt([day("jueves", { open_time: "9:00 AM", close_time: "8:00 PM" })], at("19:30"))).toBe(true)
  })
})
