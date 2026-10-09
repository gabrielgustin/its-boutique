// Convierte el número cargado en el backoffice al formato que pide WhatsApp (wa.me).
//
// Para celulares de Argentina WhatsApp exige 54 + 9 + código de área + número, sin el 0 del área
// ni el 15. La gente lo carga de muchas formas (con 0, con 15, con o sin 9), así que acá se
// normaliza. Los números de otros países se dejan como están.

const AREA_LENGTHS = [2, 3, 4]

export function whatsappNumber(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "").replace(/^00/, "")
  if (!digits) return null
  if (!digits.startsWith("54")) return digits

  let national = digits.slice(2)
  if (national.startsWith("9")) national = national.slice(1)
  national = national.replace(/^0/, "")

  // "351 15 3862108": se quita el 15 que va después del código de área.
  if (national.length === 12) {
    const area = AREA_LENGTHS.find((length) => national.slice(length, length + 2) === "15")
    if (area) national = national.slice(0, area) + national.slice(area + 2)
  }

  // Un número argentino completo tiene 10 dígitos; si no los tiene, no se inventa nada.
  return national.length === 10 ? `549${national}` : digits
}
