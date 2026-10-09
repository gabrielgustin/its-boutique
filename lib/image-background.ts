// Quita un fondo liso (blanco o de un solo color) de una imagen, en el navegador.
// Se parte de los bordes y se avanza solo por píxeles parecidos al color de fondo, así el
// interior del logo (aunque tenga partes blancas) queda intacto. No sirve para fotos.

const CORNER_SPREAD = 40 // las 4 esquinas deben ser casi del mismo color
const TOLERANCE = 42 // distancia de color (0–441) para considerar un píxel como fondo
const FEATHER = 55 // ancho del degradado en el borde del logo, para que no quede serruchado
const OPAQUE = 250

const distance = (data: Uint8ClampedArray, index: number, r: number, g: number, b: number) =>
  Math.hypot(data[index] - r, data[index + 1] - g, data[index + 2] - b)

/**
 * Hace transparente el fondo liso de `data` (RGBA). Devuelve false, sin tocar nada, si la imagen
 * ya tiene transparencia o no tiene un fondo liso detectable.
 */
export function removeSolidBackground(data: Uint8ClampedArray, width: number, height: number): boolean {
  if (width < 2 || height < 2) return false

  const at = (x: number, y: number) => (y * width + x) * 4
  const corners = [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)]

  // Si una esquina ya es transparente, la imagen no tiene fondo que quitar.
  if (corners.some((index) => data[index + 3] < OPAQUE)) return false

  const r = corners.reduce((sum, index) => sum + data[index], 0) / 4
  const g = corners.reduce((sum, index) => sum + data[index + 1], 0) / 4
  const b = corners.reduce((sum, index) => sum + data[index + 2], 0) / 4
  if (corners.some((index) => distance(data, index, r, g, b) > CORNER_SPREAD)) return false

  const removed = new Uint8Array(width * height)
  const stack: number[] = []
  const push = (x: number, y: number) => {
    const cell = y * width + x
    if (removed[cell] || distance(data, cell * 4, r, g, b) > TOLERANCE) return
    removed[cell] = 1
    stack.push(cell)
  }

  for (let x = 0; x < width; x++) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    push(0, y)
    push(width - 1, y)
  }

  while (stack.length) {
    const cell = stack.pop()!
    const x = cell % width
    const y = (cell - x) / width
    if (x > 0) push(x - 1, y)
    if (x < width - 1) push(x + 1, y)
    if (y > 0) push(x, y - 1)
    if (y < height - 1) push(x, y + 1)
  }

  // Si casi todo es "fondo", no era un logo sobre fondo liso (o es una imagen de un solo color).
  let count = 0
  for (let i = 0; i < removed.length; i++) count += removed[i]
  if (count === 0 || count > removed.length * 0.98) return false

  const feather: number[] = []
  for (let cell = 0; cell < removed.length; cell++) {
    if (removed[cell]) {
      data[cell * 4 + 3] = 0
      continue
    }
    const x = cell % width
    const y = (cell - x) / width
    const touches =
      (x > 0 && removed[cell - 1]) ||
      (x < width - 1 && removed[cell + 1]) ||
      (y > 0 && removed[cell - width]) ||
      (y < height - 1 && removed[cell + width])
    if (touches) feather.push(cell)
  }

  // Los píxeles del borde se vuelven semitransparentes según cuánto se parecen al fondo.
  for (const cell of feather) {
    const d = distance(data, cell * 4, r, g, b)
    if (d >= TOLERANCE + FEATHER) continue
    data[cell * 4 + 3] = Math.round(255 * Math.max(0, Math.min(1, (d - TOLERANCE) / FEATHER)))
  }

  return true
}

/** Rectángulo mínimo que contiene los píxeles visibles; null si no queda ninguno. */
export function visibleBounds(data: Uint8ClampedArray, width: number, height: number) {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= 8) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}
