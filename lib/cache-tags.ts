// Qué parte de la caché de la tienda (lib/db.ts) invalida cada escritura en la base.
//
// Las escrituras que no afectan a lo que se ve en la tienda (pedidos, cupones, sesiones) no la
// invalidan: si lo hicieran, cada pedido obligaría a volver a leer todo y la base de datos no
// podría apagarse entre visitas.

export type Tag = "catalog" | "config"

const CATALOG_TABLES = new Set(["categorias", "subcategorias", "productos", "producto_variantes", "producto_imagenes"])
const CONFIG_TABLES = new Set(["site_config", "business_hours", "business_hours_config", "delivery_methods", "payment_methods"])
const UNCACHED_TABLES = new Set(["pedidos", "pedido_items", "coupons", "account", "session", "user", "verification"])
const WRITE = /^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(?:ONLY\s+)?(?:\w+\.)?"?(\w+)"?/i

/** Qué cachés invalida una consulta: ninguna si no escribe; las dos si no se reconoce la tabla. */
export function tagsFor(text: string): Tag[] {
  const match = WRITE.exec(text)
  if (!match) return []
  const table = match[1].toLowerCase()
  if (CATALOG_TABLES.has(table)) return ["catalog"]
  if (CONFIG_TABLES.has(table)) return ["config"]
  if (UNCACHED_TABLES.has(table)) return []
  return ["catalog", "config"]
}
