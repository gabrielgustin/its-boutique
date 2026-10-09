import { describe, expect, it } from "vitest"
import { tagsFor } from "@/lib/cache-tags"

describe("tagsFor", () => {
  it("no invalida nada al leer", () => {
    expect(tagsFor("SELECT * FROM productos")).toEqual([])
  })

  it("invalida el catálogo al tocar productos, categorías o variantes", () => {
    expect(tagsFor("UPDATE productos SET title = $1 WHERE id = $2")).toEqual(["catalog"])
    expect(tagsFor("INSERT INTO categorias (id) VALUES ($1)")).toEqual(["catalog"])
    expect(tagsFor('DELETE FROM "producto_variantes" WHERE producto_id = $1')).toEqual(["catalog"])
  })

  it("invalida la configuración al tocar ajustes, horarios, envíos o pagos", () => {
    expect(tagsFor("INSERT INTO site_config (config_key) VALUES ($1) ON CONFLICT DO NOTHING")).toEqual(["config"])
    expect(tagsFor("UPDATE business_hours SET is_open = $1")).toEqual(["config"])
    expect(tagsFor("UPDATE delivery_methods SET name = $1")).toEqual(["config"])
  })

  it("no invalida nada con pedidos, cupones ni sesiones", () => {
    expect(tagsFor("INSERT INTO pedidos (id) VALUES ($1)")).toEqual([])
    expect(tagsFor("INSERT INTO pedido_items (id) VALUES ($1)")).toEqual([])
    expect(tagsFor("UPDATE coupons SET used = used + 1")).toEqual([])
    expect(tagsFor('UPDATE "session" SET "updatedAt" = $1')).toEqual([])
  })

  it("ante una tabla desconocida invalida todo, por seguridad", () => {
    expect(tagsFor("INSERT INTO tabla_nueva (a) VALUES ($1)")).toEqual(["catalog", "config"])
  })

  it("ignora espacios, mayúsculas y el esquema", () => {
    expect(tagsFor("  update public.Productos set a = 1")).toEqual(["catalog"])
  })
})
