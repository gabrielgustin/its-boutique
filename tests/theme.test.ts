import { describe, expect, it } from "vitest"
import { DEFAULT_THEME, PRESETS, applyPreset, contrastRatio, resolveColor, sanitizeTheme, themeCss } from "@/lib/theme"

describe("sanitizeTheme", () => {
  it("descarta todo lo que no sea una opción conocida", () => {
    const theme = sanitizeTheme({ primary: "red; } body { display:none", corners: "<script>", headingFont: "Comic Sans", logoUrl: "javascript:alert(1)", texts: { viewCart: "  Mi bolsa  ", otra: "x" } })
    expect(theme.primary).toBeNull()
    expect(theme.corners).toBe("round")
    expect(theme.headingFont).toBeNull()
    expect(theme.logoUrl).toBeNull()
    expect(theme.texts).toEqual({ viewCart: "Mi bolsa" })
  })
  it("acepta colores hex e imágenes subidas", () => {
    const theme = sanitizeTheme({ primary: "#AABBCC", logoUrl: "/media/abc123.webp" })
    expect(theme.primary).toBe("#aabbcc")
    expect(theme.logoUrl).toBe("/media/abc123.webp")
  })
})

describe("themeCss", () => {
  it("el diseño original no genera CSS", () => {
    expect(themeCss(DEFAULT_THEME)).toBe("")
  })
  it("un color propio pisa su variable y calcula el texto legible encima", () => {
    const css = themeCss(sanitizeTheme({ primary: "#111111" }))
    expect(css).toContain("--st-primary:#111111")
    expect(css).toContain("--st-primary-fg:#ffffff")
  })
})

describe("plantillas", () => {
  it.each(PRESETS)("$name: textos legibles sobre sus fondos", (preset) => {
    const theme = applyPreset(DEFAULT_THEME, preset)
    expect(contrastRatio(resolveColor(theme, "foreground"), resolveColor(theme, "pageBg"))).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(resolveColor(theme, "heading"), resolveColor(theme, "pageBg"))).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(resolveColor(theme, "buttonText"), resolveColor(theme, "button"))).toBeGreaterThanOrEqual(4.5)
  })
  it("aplicar una plantilla conserva logo y textos", () => {
    const theme = applyPreset(sanitizeTheme({ logoUrl: "/media/logo.webp", texts: { viewCart: "Mi bolsa" } }), PRESETS[1])
    expect(theme.logoUrl).toBe("/media/logo.webp")
    expect(theme.texts.viewCart).toBe("Mi bolsa")
  })
})
