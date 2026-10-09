export const MIN_PASSWORD_LENGTH = 8

const USERNAME_EMAIL_DOMAIN = "its-boutique.local"

// Better Auth identifica las cuentas por email. Si quien entra escribe un
// usuario simple (ej. "Daniel"), lo convertimos a un email interno estable.
export function toLoginEmail(identifier: string) {
  const value = identifier.trim().toLowerCase()
  if (value.includes("@")) return value
  return `${value}@${USERNAME_EMAIL_DOMAIN}`
}
