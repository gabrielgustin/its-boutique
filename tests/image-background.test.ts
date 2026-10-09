import { describe, expect, it } from "vitest"
import { removeSolidBackground, visibleBounds } from "@/lib/image-background"

type Rgb = [number, number, number]

// Imagen de prueba: fondo `bg` y un cuadrado `fg` en el centro (con un hueco opcional del color del fondo).
function image(size: number, bg: Rgb, fg: Rgb, hole?: Rgb) {
  const data = new Uint8ClampedArray(size * size * 4)
  const lo = Math.floor(size / 4)
  const hi = size - lo
  const mid = Math.floor(size / 2)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inside = x >= lo && x < hi && y >= lo && y < hi
      const inHole = hole && Math.abs(x - mid) < 2 && Math.abs(y - mid) < 2
      const color = inHole ? hole : inside ? fg : bg
      data.set([...color, 255], (y * size + x) * 4)
    }
  }
  return data
}

const alphaAt = (data: Uint8ClampedArray, size: number, x: number, y: number) => data[(y * size + x) * 4 + 3]

describe("removeSolidBackground", () => {
  it("hace transparente un fondo blanco y conserva el logo", () => {
    const data = image(20, [255, 255, 255], [30, 70, 140])
    expect(removeSolidBackground(data, 20, 20)).toBe(true)
    expect(alphaAt(data, 20, 0, 0)).toBe(0)
    expect(alphaAt(data, 20, 19, 19)).toBe(0)
    expect(alphaAt(data, 20, 10, 10)).toBe(255)
  })

  it("funciona con un fondo de color", () => {
    const data = image(20, [250, 220, 0], [20, 20, 20])
    expect(removeSolidBackground(data, 20, 20)).toBe(true)
    expect(alphaAt(data, 20, 1, 1)).toBe(0)
    expect(alphaAt(data, 20, 10, 10)).toBe(255)
  })

  it("no toca el interior del logo aunque tenga partes del color del fondo", () => {
    const data = image(20, [255, 255, 255], [30, 70, 140], [255, 255, 255])
    removeSolidBackground(data, 20, 20)
    expect(alphaAt(data, 20, 10, 10)).toBe(255)
  })

  it("no hace nada si la imagen ya es transparente", () => {
    const data = image(20, [255, 255, 255], [30, 70, 140])
    data[3] = 0
    const before = Array.from(data)
    expect(removeSolidBackground(data, 20, 20)).toBe(false)
    expect(Array.from(data)).toEqual(before)
  })

  it("no hace nada si no hay un fondo liso (esquinas distintas)", () => {
    const data = image(20, [255, 255, 255], [30, 70, 140])
    data.set([0, 0, 0, 255], 0)
    expect(removeSolidBackground(data, 20, 20)).toBe(false)
  })

  it("no hace nada si toda la imagen es del mismo color", () => {
    const data = image(20, [255, 255, 255], [255, 255, 255])
    expect(removeSolidBackground(data, 20, 20)).toBe(false)
  })
})

describe("visibleBounds", () => {
  it("devuelve el rectángulo del logo sin los márgenes transparentes", () => {
    const data = image(20, [255, 255, 255], [30, 70, 140])
    removeSolidBackground(data, 20, 20)
    expect(visibleBounds(data, 20, 20)).toEqual({ x: 5, y: 5, width: 10, height: 10 })
  })

  it("devuelve null si no queda nada visible", () => {
    expect(visibleBounds(new Uint8ClampedArray(16), 2, 2)).toBeNull()
  })
})
