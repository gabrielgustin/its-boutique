import { describe, expect, it } from "vitest"
import { couponDiscount, orderNumber, orderTotals, unitPrice } from "@/lib/pricing"

describe("unitPrice", () => {
  it("aplica el descuento del producto y redondea a pesos", () => {
    expect(unitPrice(18000, 20)).toBe(14400)
    expect(unitPrice(999, 15)).toBe(849)
  })
  it("sin descuento devuelve el precio base", () => {
    expect(unitPrice(5000)).toBe(5000)
    expect(unitPrice(5000, 0)).toBe(5000)
  })
  it("nunca descuenta más del 100 % ni menos de 0", () => {
    expect(unitPrice(5000, 150)).toBe(0)
    expect(unitPrice(5000, -20)).toBe(5000)
  })
})

describe("couponDiscount", () => {
  it("porcentaje sobre el subtotal", () => {
    expect(couponDiscount(14400, { code: "A", discount_type: "percentage", discount_value: 10 })).toBe(1440)
  })
  it("monto fijo, sin superar el subtotal", () => {
    expect(couponDiscount(14400, { code: "A", discount_type: "fixed", discount_value: 2000 })).toBe(2000)
    expect(couponDiscount(1500, { code: "A", discount_type: "fixed", discount_value: 2000 })).toBe(1500)
  })
  it("sin cupón no descuenta", () => {
    expect(couponDiscount(14400, null)).toBe(0)
  })
})

describe("orderTotals", () => {
  it("subtotal - cupón + envío", () => {
    const totals = orderTotals([{ price: 14400, quantity: 1 }, { price: 5000, quantity: 2 }], { code: "A", discount_type: "percentage", discount_value: 10 }, 3000)
    expect(totals).toEqual({ subtotal: 24400, discount: 2440, delivery: 3000, total: 24960 })
  })
  it("el envío no puede ser negativo", () => {
    expect(orderTotals([{ price: 1000, quantity: 1 }], null, -500).total).toBe(1000)
  })
})

describe("orderNumber", () => {
  it("rellena con ceros", () => {
    expect(orderNumber(7)).toBe("#00007")
    expect(orderNumber(123456)).toBe("#123456")
  })
})
