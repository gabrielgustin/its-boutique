import { describe, expect, it } from "vitest"
import { whatsappNumber } from "@/lib/whatsapp"

describe("whatsappNumber", () => {
  it("agrega el 9 que WhatsApp pide para celulares de Argentina", () => {
    expect(whatsappNumber("+54 3513862108")).toBe("5493513862108")
    expect(whatsappNumber("+54 351 386-2108")).toBe("5493513862108")
    expect(whatsappNumber("+54 11 2345 6789")).toBe("5491123456789")
  })

  it("no lo duplica si ya está", () => {
    expect(whatsappNumber("+54 9 351 3862108")).toBe("5493513862108")
    expect(whatsappNumber("5493513862108")).toBe("5493513862108")
  })

  it("quita el 0 del código de área y el 15", () => {
    expect(whatsappNumber("+54 0351 3862108")).toBe("5493513862108")
    expect(whatsappNumber("+54 351 15 3862108")).toBe("5493513862108")
    expect(whatsappNumber("+54 0351 15 3862108")).toBe("5493513862108")
    expect(whatsappNumber("+54 011 15 2345 6789")).toBe("5491123456789")
    expect(whatsappNumber("+54 2944 15 123456")).toBe("5492944123456")
  })

  it("deja como están los números de otros países", () => {
    expect(whatsappNumber("+598 99 123 456")).toBe("59899123456")
    expect(whatsappNumber("+1 (415) 555-0100")).toBe("14155550100")
  })

  it("no inventa nada si al número argentino le faltan o le sobran dígitos", () => {
    expect(whatsappNumber("+54 351 386")).toBe("54351386")
  })

  it("devuelve null si no hay número", () => {
    expect(whatsappNumber("")).toBeNull()
    expect(whatsappNumber(null)).toBeNull()
    expect(whatsappNumber("+54 ")).toBe("54")
  })
})
