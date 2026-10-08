// "Personaliza tu App": todo lo que el dueño puede cambiar del diseño de la tienda.
// Un valor `null` significa "usar el diseño original": personalizar es siempre una
// capa encima de lo que ya hay (colores de site_config + estilos de globals.css).

// ───────────── Colores ─────────────

export type ColorKey =
  | "primary"
  | "secondary"
  | "accent"
  | "pageBg"
  | "headerBg"
  | "card"
  | "foreground"
  | "heading"
  | "price"
  | "mutedText"
  | "navBg"
  | "button"
  | "buttonText"
  | "border"

export type ColorGroup = "Marca" | "Fondos" | "Textos" | "Botones y menú"

export interface ColorDef {
  key: ColorKey
  label: string
  hint: string
  group: ColorGroup
  /** Hex que se ve cuando el color es el del diseño original. */
  fallback: string
  /** Mientras no se elija uno, copia el color de otra pieza. */
  inherits?: ColorKey
  /** Se calcula solo a partir de otros colores. */
  automatic?: boolean
}

export const COLOR_DEFS: ColorDef[] = [
  { key: "primary", label: "Color principal", hint: "Barras de título, íconos y, si no elegís otro, botones y menú lateral.", group: "Marca", fallback: "#1e4b8e" },
  { key: "secondary", label: "Color del banner", hint: "Fondo del cartel de promoción, del aviso de local cerrado y de la barra «Ver mi pedido».", group: "Marca", fallback: "#d7ecf8" },
  { key: "accent", label: "Color de ofertas", hint: "Etiquetas de descuento.", group: "Marca", fallback: "#b4235a" },

  { key: "pageBg", label: "Fondo de la tienda", hint: "El color de fondo de todas las pantallas.", group: "Fondos", fallback: "#f4f4f5" },
  { key: "headerBg", label: "Encabezado", hint: "Fondo de la franja superior con el logo.", group: "Fondos", fallback: "#fafafa" },
  { key: "card", label: "Tarjetas y formularios", hint: "Fondo de las tarjetas, el carrito y los campos.", group: "Fondos", fallback: "#ffffff" },

  { key: "foreground", label: "Texto general", hint: "Color del texto en general.", group: "Textos", fallback: "#1f2937" },
  { key: "heading", label: "Títulos", hint: "Títulos de las pantallas y nombres de productos.", group: "Textos", fallback: "#111827" },
  { key: "price", label: "Precios", hint: "Color de los precios.", group: "Textos", fallback: "#111827", inherits: "heading" },
  { key: "mutedText", label: "Textos secundarios", hint: "Descripciones y aclaraciones.", group: "Textos", fallback: "#6b7280", automatic: true },

  { key: "navBg", label: "Menú lateral", hint: "Fondo del menú que se abre con las tres rayitas.", group: "Botones y menú", fallback: "#1e4b8e", inherits: "primary" },
  { key: "button", label: "Botones principales", hint: "Agregar al carrito, finalizar pedido, ver mi pedido.", group: "Botones y menú", fallback: "#1e4b8e", inherits: "primary" },
  { key: "buttonText", label: "Texto de los botones", hint: "Se elige solo según el color del botón.", group: "Botones y menú", fallback: "#ffffff", automatic: true },
  { key: "border", label: "Bordes y divisores", hint: "Líneas finas que separan las secciones.", group: "Botones y menú", fallback: "#e5e7eb", automatic: true },
]

export const COLOR_KEYS = COLOR_DEFS.map((def) => def.key)

export const HEX_COLOR = /^#[0-9a-f]{6}$/i

const hexToRgb = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16))
const rgbToHex = (rgb: number[]) => `#${rgb.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`

/** Mezcla dos colores: `percent` % del primero. */
export const mixHex = (a: string, b: string, percent: number) => {
  const [first, second] = [hexToRgb(a), hexToRgb(b)]
  return rgbToHex(first.map((value, index) => (value * percent) / 100 + second[index] * (1 - percent / 100)))
}

const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contraste WCAG entre dos colores hex (1 a 21). */
export const contrastRatio = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

// Texto claro u oscuro sobre un color: el que más contraste tenga.
export const readableOn = (hex: string) => (contrastRatio(hex, "#1f1410") >= contrastRatio(hex, "#ffffff") ? "#1f1410" : "#ffffff")

// ───────────── Tipografías ─────────────

export interface FontDef {
  name: string
  kind: "Con serifa" | "Sin serifa" | "Impacto" | "Manuscrita"
  /** Pesos que existen en Google Fonts (pedir uno inexistente rompe la hoja de estilos). */
  weights: string
}

export const FONTS: FontDef[] = [
  { name: "Playfair Display", kind: "Con serifa", weights: "400;500;600;700" },
  { name: "DM Serif Display", kind: "Con serifa", weights: "400" },
  { name: "Cormorant Garamond", kind: "Con serifa", weights: "400;500;600;700" },
  { name: "Cinzel", kind: "Con serifa", weights: "400;500;600;700" },
  { name: "Lora", kind: "Con serifa", weights: "400;500;600;700" },
  { name: "Merriweather", kind: "Con serifa", weights: "400;700" },
  { name: "Fraunces", kind: "Con serifa", weights: "400;500;600;700" },
  { name: "Abril Fatface", kind: "Impacto", weights: "400" },
  { name: "Oswald", kind: "Impacto", weights: "400;500;600;700" },
  { name: "Bebas Neue", kind: "Impacto", weights: "400" },
  { name: "Anton", kind: "Impacto", weights: "400" },
  { name: "Archivo Black", kind: "Impacto", weights: "400" },
  { name: "Lobster", kind: "Manuscrita", weights: "400" },
  { name: "Pacifico", kind: "Manuscrita", weights: "400" },
  { name: "Caveat", kind: "Manuscrita", weights: "400;500;600;700" },
  { name: "DM Sans", kind: "Sin serifa", weights: "400;500;600;700" },
  { name: "Inter", kind: "Sin serifa", weights: "400;500;600;700" },
  { name: "Poppins", kind: "Sin serifa", weights: "400;500;600;700" },
  { name: "Montserrat", kind: "Sin serifa", weights: "400;500;600;700" },
  { name: "Raleway", kind: "Sin serifa", weights: "400;500;600;700" },
  { name: "Nunito", kind: "Sin serifa", weights: "400;500;600;700" },
  { name: "Work Sans", kind: "Sin serifa", weights: "400;500;600;700" },
  { name: "Open Sans", kind: "Sin serifa", weights: "400;500;600;700" },
  { name: "Lato", kind: "Sin serifa", weights: "400;700;900" },
  { name: "Roboto", kind: "Sin serifa", weights: "400;500;700" },
]

// Originales del diseño (se cargan con next/font en el layout de la tienda).
export const DEFAULT_HEADING_FONT = "Anton"
export const DEFAULT_BODY_FONT = "Lato"

const fontByName = (name: string) => FONTS.find((font) => font.name === name)

export const googleFontsHref = (names: string[]) => {
  const families = names
    .map(fontByName)
    .filter((font): font is FontDef => Boolean(font))
    .map((font) => `family=${font.name.replace(/ /g, "+")}:wght@${font.weights}`)
  return families.length ? `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap` : null
}

export const themeFontsHref = (theme: Pick<ThemeSettings, "headingFont" | "bodyFont">) =>
  googleFontsHref([theme.headingFont, theme.bodyFont].filter((name): name is string => Boolean(name)))

// ───────────── Opciones de estilo ─────────────

export interface Option<T extends string | number> {
  value: T
  label: string
  hint?: string
}

export const HEADING_CASES: Option<"upper" | "normal">[] = [
  { value: "normal", label: "Normal", hint: "Original" },
  { value: "upper", label: "MAYÚSCULAS" },
]
export const HEADING_SPACINGS: Option<"compact" | "normal" | "wide">[] = [
  { value: "compact", label: "Junto" },
  { value: "normal", label: "Normal", hint: "Original" },
  { value: "wide", label: "Separado" },
]
export const TEXT_SCALES: Option<"sm" | "md" | "lg">[] = [
  { value: "sm", label: "Chico" },
  { value: "md", label: "Normal", hint: "Original" },
  { value: "lg", label: "Grande" },
]
export const CORNERS: Option<"square" | "soft" | "round" | "extra">[] = [
  { value: "square", label: "Rectos" },
  { value: "soft", label: "Suaves" },
  { value: "round", label: "Redondeados", hint: "Original" },
  { value: "extra", label: "Muy redondeados" },
]
export const BUTTONS: Option<"pill" | "rounded" | "square">[] = [
  { value: "rounded", label: "Redondeados", hint: "Original" },
  { value: "pill", label: "Píldora" },
  { value: "square", label: "Rectos" },
]
export const LOGO_SIZES: Option<"sm" | "md" | "lg">[] = [
  { value: "sm", label: "Chico" },
  { value: "md", label: "Mediano", hint: "Original" },
  { value: "lg", label: "Grande" },
]
export const LOGO_ALIGNS: Option<"left" | "center">[] = [
  { value: "left", label: "A la izquierda", hint: "Original" },
  { value: "center", label: "Centrado" },
]
export const PRODUCT_LAYOUTS: Option<"list" | "grid">[] = [
  { value: "list", label: "Tarjetas con foto al costado", hint: "Original" },
  { value: "grid", label: "Grilla", hint: "Foto grande arriba" },
]
export const CATEGORY_LAYOUTS: Option<"banners" | "tiles">[] = [
  { value: "banners", label: "Banners", hint: "Foto ancha con el nombre encima. Original" },
  { value: "tiles", label: "Mosaico", hint: "Fotos verticales de a dos" },
]
export const IMAGE_RATIOS: Option<"portrait" | "square">[] = [
  { value: "portrait", label: "Vertical", hint: "Ideal para ropa. Original" },
  { value: "square", label: "Cuadrada" },
]

// ───────────── Textos editables ─────────────

export type TextKey = "categoriesTitle" | "searchPlaceholder" | "viewCart" | "addToCart" | "checkoutButton"

export const TEXT_DEFS: { key: TextKey; label: string; where: string; original: string }[] = [
  { key: "categoriesTitle", label: "Título de la portada", where: "Sobre la lista de categorías", original: "Categorías" },
  { key: "searchPlaceholder", label: "Texto del buscador", where: "Dentro de la barra de búsqueda", original: "Buscar productos" },
  { key: "addToCart", label: "Botón de agregar", where: "En la ficha de cada producto", original: "Agregar al carrito" },
  { key: "viewCart", label: "Botón del pedido", where: "Barra fija al agregar productos", original: "Ver mi pedido" },
  { key: "checkoutButton", label: "Botón de confirmar", where: "Al final del formulario del pedido", original: "Confirmar pedido" },
]

export type TextOverrides = Partial<Record<TextKey, string>>

// ───────────── Modelo del tema ─────────────

export interface ThemeSettings extends Record<ColorKey, string | null> {
  headingFont: string | null
  bodyFont: string | null
  headingCase: "upper" | "normal"
  headingSpacing: "compact" | "normal" | "wide"
  textScale: "sm" | "md" | "lg"
  corners: "square" | "soft" | "round" | "extra"
  buttons: "pill" | "rounded" | "square"
  logoSize: "sm" | "md" | "lg"
  logoAlign: "left" | "center"
  productLayout: "list" | "grid"
  categoryLayout: "banners" | "tiles"
  imageRatio: "portrait" | "square"
  showSearch: boolean
  showDiscountBadge: boolean
  logoUrl: string | null
  faviconUrl: string | null
  shareImageUrl: string | null
  siteName: string | null
  siteDescription: string | null
  texts: TextOverrides
}

/** Logo que se usa mientras no se suba otro desde Personaliza tu App. */
export const DEFAULT_LOGO_URL = "/logo-its-boutique.png"
export const DEFAULT_SITE_NAME = "ITS Boutique"
export const DEFAULT_SITE_DESCRIPTION = "Catálogo digital de ITS Boutique."

export const DEFAULT_THEME: ThemeSettings = {
  ...(Object.fromEntries(COLOR_KEYS.map((key) => [key, null])) as Record<ColorKey, null>),
  headingFont: null,
  bodyFont: null,
  headingCase: "normal",
  headingSpacing: "normal",
  textScale: "md",
  corners: "round",
  buttons: "rounded",
  logoSize: "md",
  logoAlign: "left",
  productLayout: "list",
  categoryLayout: "banners",
  imageRatio: "portrait",
  showSearch: true,
  showDiscountBadge: true,
  logoUrl: null,
  faviconUrl: null,
  shareImageUrl: null,
  siteName: null,
  siteDescription: null,
  texts: {},
}

/** Claves de apariencia: lo que cambia una plantilla (no toca imágenes ni textos). */
export const STYLE_KEYS = [
  ...COLOR_KEYS,
  "headingFont",
  "bodyFont",
  "headingCase",
  "headingSpacing",
  "textScale",
  "corners",
  "buttons",
  "logoSize",
  "logoAlign",
  "productLayout",
  "categoryLayout",
  "imageRatio",
  "showSearch",
  "showDiscountBadge",
] as const satisfies readonly (keyof ThemeSettings)[]

// Imágenes subidas desde el backoffice (/media/...) o ya alojadas (https://...).
const IMAGE_URL = /^(\/media\/[\w.-]+|https:\/\/[^\s"'<>()]+)$/

const oneOf = <T extends string | number>(value: unknown, options: readonly Option<T>[], fallback: T): T =>
  options.some((option) => option.value === value) ? (value as T) : fallback

const text = (value: unknown, max: number) => {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, max)
  return trimmed || null
}

/**
 * Convierte cualquier valor en un tema válido. Se usa al leer el archivo, al
 * guardar y al recibir la vista previa en vivo: nada que no sea una opción
 * conocida llega nunca al CSS.
 */
export function sanitizeTheme(input: unknown): ThemeSettings {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>
  const theme: ThemeSettings = { ...DEFAULT_THEME, texts: {} }

  for (const key of COLOR_KEYS) {
    const value = raw[key]
    theme[key] = typeof value === "string" && HEX_COLOR.test(value) ? value.toLowerCase() : null
  }

  const font = (value: unknown, original: string) =>
    typeof value === "string" && fontByName(value) && value !== original ? value : null
  theme.headingFont = font(raw.headingFont, DEFAULT_HEADING_FONT)
  theme.bodyFont = font(raw.bodyFont, DEFAULT_BODY_FONT)

  theme.headingCase = oneOf(raw.headingCase, HEADING_CASES, "normal")
  theme.headingSpacing = oneOf(raw.headingSpacing, HEADING_SPACINGS, "normal")
  theme.textScale = oneOf(raw.textScale, TEXT_SCALES, "md")
  theme.corners = oneOf(raw.corners, CORNERS, "round")
  theme.buttons = oneOf(raw.buttons, BUTTONS, "rounded")
  theme.logoSize = oneOf(raw.logoSize, LOGO_SIZES, "md")
  theme.logoAlign = oneOf(raw.logoAlign, LOGO_ALIGNS, "left")
  theme.productLayout = oneOf(raw.productLayout, PRODUCT_LAYOUTS, "list")
  theme.categoryLayout = oneOf(raw.categoryLayout, CATEGORY_LAYOUTS, "banners")
  theme.imageRatio = oneOf(raw.imageRatio, IMAGE_RATIOS, "portrait")

  for (const key of ["showSearch", "showDiscountBadge"] as const) {
    theme[key] = typeof raw[key] === "boolean" ? raw[key] : DEFAULT_THEME[key]
  }

  for (const key of ["logoUrl", "faviconUrl", "shareImageUrl"] as const) {
    const value = raw[key]
    theme[key] = typeof value === "string" && IMAGE_URL.test(value) ? value : null
  }

  theme.siteName = text(raw.siteName, 60)
  theme.siteDescription = text(raw.siteDescription, 200)

  const texts = (raw.texts && typeof raw.texts === "object" ? raw.texts : {}) as Record<string, unknown>
  for (const { key } of TEXT_DEFS) {
    const value = text(texts[key], 60)
    if (value) theme.texts[key] = value
  }

  return theme
}

// ───────────── Colores efectivos ─────────────

/** El color que realmente se ve, sea propio o heredado de otra pieza. */
export function resolveColor(theme: Pick<ThemeSettings, ColorKey>, key: ColorKey): string {
  const own = theme[key]
  if (own) return own

  if (key === "mutedText") return mixHex(resolveColor(theme, "foreground"), resolveColor(theme, "card"), 62)
  if (key === "border") return mixHex(resolveColor(theme, "foreground"), resolveColor(theme, "card"), 12)
  if (key === "buttonText") return readableOn(resolveColor(theme, "button"))

  const def = COLOR_DEFS.find((entry) => entry.key === key)!
  return def.inherits ? resolveColor(theme, def.inherits) : def.fallback
}

// ───────────── CSS ─────────────

const RADIUS_CARD = { square: "0px", soft: "0.375rem", round: "0.75rem", extra: "1.5rem" }
const RADIUS_BUTTON = { pill: "9999px", rounded: "0.625rem", square: "0px" }
const LOGO_REM = { sm: "2.25rem", md: "3.1rem", lg: "4rem" }
const TRACKING = { compact: "-0.02em", normal: "0", wide: "0.08em" }
const SCALE = { sm: "93.75%", md: "100%", lg: "112.5%" }

/**
 * Variables CSS del tema: solo las que se apartan del diseño original.
 * Los valores por defecto viven en app/globals.css (bloque `.store`).
 */
export function themeVariables(theme: ThemeSettings): Record<string, string> {
  const vars: Record<string, string> = {}
  const set = (name: string, value: string | null) => {
    if (value) vars[name] = value
  }
  /** Color + su texto legible encima. */
  const pair = (name: string, value: string | null) => {
    if (!value) return
    vars[name] = value
    vars[`${name}-fg`] = readableOn(value)
  }

  pair("--st-primary", theme.primary)
  pair("--st-secondary", theme.secondary)
  pair("--st-accent", theme.accent)
  pair("--st-nav", theme.navBg)
  pair("--st-button", theme.button)
  set("--st-button-fg", theme.buttonText)

  set("--st-bg", theme.pageBg)
  pair("--st-header", theme.headerBg)
  set("--st-card", theme.card)
  set("--st-text", theme.foreground)
  set("--st-heading", theme.heading)
  set("--st-price", theme.price ?? theme.heading)

  // Tonos derivados: siguen al texto y a las tarjetas, salvo que se elijan a mano.
  if (theme.mutedText || theme.foreground || theme.card) vars["--st-muted"] = resolveColor(theme, "mutedText")
  if (theme.border || theme.foreground || theme.card) vars["--st-border"] = resolveColor(theme, "border")

  if (theme.headingFont) vars["--st-font-heading"] = `"${theme.headingFont}"`
  if (theme.bodyFont) vars["--st-font-body"] = `"${theme.bodyFont}"`
  if (theme.headingCase === "upper") vars["--st-heading-case"] = "uppercase"
  if (theme.headingSpacing !== "normal") vars["--st-heading-tracking"] = TRACKING[theme.headingSpacing]

  if (theme.corners !== "round") vars["--st-radius"] = RADIUS_CARD[theme.corners]
  if (theme.buttons !== "rounded") vars["--st-radius-btn"] = RADIUS_BUTTON[theme.buttons]
  if (theme.logoSize !== "md") vars["--st-logo-h"] = LOGO_REM[theme.logoSize]
  if (theme.imageRatio !== "portrait") vars["--st-image-ratio"] = "1 / 1"

  return vars
}

export function themeCss(theme: ThemeSettings): string {
  const entries = Object.entries(themeVariables(theme))
  const rules: string[] = []
  if (entries.length) rules.push(`.store{${entries.map(([key, value]) => `${key}:${value}`).join(";")}}`)
  if (theme.textScale !== "md") rules.push(`html{font-size:${SCALE[theme.textScale]}}`)
  return rules.join("\n")
}

// ───────────── Plantillas ─────────────

export interface ThemePreset {
  id: string
  name: string
  description: string
  patch: Partial<ThemeSettings>
}

export const PRESETS: ThemePreset[] = [
  { id: "original", name: "ITS Boutique", description: "El diseño original de la tienda.", patch: {} },
  {
    id: "noche",
    name: "Noche",
    description: "Fondo oscuro con detalles dorados.",
    patch: { primary: "#c9a24b", secondary: "#2a2622", accent: "#e6c77a", pageBg: "#15110f", headerBg: "#15110f", card: "#211c19", foreground: "#e9dfd2", heading: "#f6efe5", price: "#e6c77a", navBg: "#211c19", headingFont: "Cormorant Garamond", bodyFont: "Inter", corners: "soft" },
  },
  {
    id: "rosa",
    name: "Rosa",
    description: "Rosados suaves, redondeado y delicado.",
    patch: { primary: "#c2417a", secondary: "#fde4ef", accent: "#c2417a", pageBg: "#fff5f9", headerBg: "#ffffff", card: "#ffffff", foreground: "#3b1d2c", heading: "#7a2250", headingFont: "DM Serif Display", bodyFont: "Poppins", buttons: "pill", corners: "extra" },
  },
  {
    id: "elegante",
    name: "Elegante",
    description: "Negro y dorado, serifa clásica.",
    patch: { primary: "#111111", secondary: "#f1e6c8", accent: "#8a6d1f", pageBg: "#ffffff", headerBg: "#ffffff", card: "#faf7f0", foreground: "#1a1a1a", heading: "#111111", price: "#8a6d1f", headingFont: "Cormorant Garamond", bodyFont: "Lato", headingCase: "upper", headingSpacing: "wide", buttons: "square", corners: "square" },
  },
  {
    id: "fresco",
    name: "Fresco",
    description: "Verdes suaves, amigable.",
    patch: { primary: "#2f7d4a", secondary: "#dff1e4", accent: "#c2410c", pageBg: "#f3f8f1", headerBg: "#ffffff", card: "#ffffff", foreground: "#1d2b21", heading: "#1d4a2c", headingFont: "Poppins", bodyFont: "Poppins", corners: "extra", buttons: "pill" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Blanco y negro, líneas rectas.",
    patch: { primary: "#111111", secondary: "#eeeeee", accent: "#111111", pageBg: "#ffffff", headerBg: "#ffffff", card: "#ffffff", foreground: "#111111", heading: "#111111", border: "#dddddd", headingFont: "Montserrat", bodyFont: "Montserrat", headingSpacing: "wide", buttons: "square", corners: "square", imageRatio: "square" },
  },
  {
    id: "urbano",
    name: "Urbano",
    description: "Títulos de impacto en mayúsculas.",
    patch: { primary: "#e11d48", secondary: "#111827", accent: "#e11d48", pageBg: "#f4f4f5", headerBg: "#111827", card: "#ffffff", foreground: "#18181b", heading: "#09090b", navBg: "#111827", headingFont: "Anton", bodyFont: "Inter", headingCase: "upper", corners: "soft" },
  },
]

/** Aplica una plantilla sobre el tema: cambia la apariencia pero conserva imágenes y textos. */
export function applyPreset(theme: ThemeSettings, preset: ThemePreset): ThemeSettings {
  const next: ThemeSettings = { ...theme }
  for (const key of STYLE_KEYS) (next as unknown as Record<string, unknown>)[key] = DEFAULT_THEME[key]
  return sanitizeTheme({ ...next, ...preset.patch })
}
