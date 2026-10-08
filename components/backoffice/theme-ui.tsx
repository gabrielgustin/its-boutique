"use client"

import { useId, useRef, useState } from "react"
import { Check, ImagePlus, Loader2, X } from "lucide-react"
import { COLOR_DEFS, FONTS, resolveColor, type ColorDef, type FontDef, type Option, type ThemeSettings } from "@/lib/theme"
import { uploadBackofficeImage } from "@/lib/backoffice-image-upload"
import { cn } from "@/lib/utils"

// Controles del editor "Personaliza tu App". Usan el azul fijo del backoffice (no el tema
// de la tienda), así que el panel se ve igual sin importar qué diseño se esté editando.

const BLUE = "#1e4b8e"
const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4b8e]/50"
const buttonBase = `inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 ${ring}`

export const btnPrimary = `${buttonBase} bg-[#1e4b8e] text-white hover:bg-[#1e4b8e]/90`
export const btnOutline = `${buttonBase} border border-gray-300 bg-white text-gray-800 hover:border-[#1e4b8e] hover:text-[#1e4b8e]`
export const btnDanger = `${buttonBase} bg-red-700 text-white hover:bg-red-800`
export const inputClass =
  "h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#1e4b8e] focus:ring-2 focus:ring-[#1e4b8e]/20"

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500">{hint}</span>}
    </label>
  )
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
      {message}
    </p>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(`relative h-6 w-11 shrink-0 rounded-full transition ${ring}`, checked ? "bg-[#1e4b8e]" : "bg-gray-300")}
    >
      <span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  )
}

export function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      <header>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </header>
      {children}
    </section>
  )
}

/** Elegir una opción entre pocas, con todas a la vista. */
export function Segmented<T extends string | number>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string
  hint?: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      <div role="radiogroup" aria-label={label} className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                `flex flex-col items-start rounded-md border px-3 py-2 text-left transition ${ring}`,
                active ? "border-[#1e4b8e] bg-[#1e4b8e]/5 ring-1 ring-[#1e4b8e]" : "border-gray-200 bg-white hover:border-[#1e4b8e]/60",
              )}
            >
              <span className="flex w-full items-center justify-between gap-2 text-sm font-medium text-gray-800">
                {option.label}
                {active && <Check className="h-4 w-4 text-[#1e4b8e]" aria-hidden />}
              </span>
              {option.hint && <span className="text-xs text-gray-500">{option.hint}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      <Switch checked={checked} label={label} onChange={onChange} />
    </div>
  )
}

/** Un color del diseño: selector, código hexadecimal y vuelta al valor automático. */
export function ColorRow({ def, theme, onChange }: { def: ColorDef; theme: ThemeSettings; onChange: (value: string | null) => void }) {
  const own = theme[def.key]
  const shown = resolveColor(theme, def.key)
  const [text, setText] = useState(shown)
  const [lastShown, setLastShown] = useState(shown)

  // El campo de texto sigue al selector (y a "automático") pero deja escribir libremente.
  if (shown !== lastShown) {
    setLastShown(shown)
    setText(shown)
  }

  const inheritedFrom = def.inherits ? COLOR_DEFS.find((entry) => entry.key === def.inherits)?.label : null
  const autoNote = def.automatic ? "Automático" : inheritedFrom ? `Igual que “${inheritedFrom}”` : "Original"

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2">
      <input
        type="color"
        aria-label={`${def.label}: selector de color`}
        value={shown}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-gray-300 bg-white p-1"
      />
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-sm font-medium text-gray-800">{def.label}</p>
        <p className="text-xs text-gray-500">{def.hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          aria-label={`${def.label}: código hexadecimal`}
          className={`${inputClass} h-9 w-28 font-mono uppercase`}
          value={text}
          maxLength={7}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value.startsWith("#") ? event.target.value : `#${event.target.value}`
            setText(next)
            if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next.toLowerCase())
          }}
        />
        {own ? (
          <button type="button" className="w-24 text-left text-xs font-semibold text-[#1e4b8e] hover:underline" onClick={() => onChange(null)}>
            Restablecer
          </button>
        ) : (
          <span className="w-24 text-xs text-gray-500">{autoNote}</span>
        )}
      </div>
    </div>
  )
}

/** Lista de tipografías, cada una escrita con su propia letra. */
export function FontPicker({
  label,
  hint,
  value,
  original,
  sample,
  onChange,
}: {
  label: string
  hint: string
  value: string | null
  original: string
  sample: string
  onChange: (value: string | null) => void
}) {
  const kinds: FontDef["kind"][] = ["Con serifa", "Sin serifa", "Impacto", "Manuscrita"]
  const [kind, setKind] = useState<FontDef["kind"] | "Todas">("Todas")
  const current = value ?? original
  const visible = FONTS.filter((font) => kind === "Todas" || font.kind === kind)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Estilo de ${label.toLowerCase()}`}>
        {(["Todas", ...kinds] as const).map((entry) => (
          <button
            key={entry}
            type="button"
            aria-pressed={kind === entry}
            onClick={() => setKind(entry)}
            className={cn(
              `rounded-md px-2.5 py-1 text-xs font-medium transition ${ring}`,
              kind === entry ? "bg-[#1e4b8e] text-white" : "bg-gray-100 text-gray-600 hover:text-gray-900",
            )}
          >
            {entry}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label={label} className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {/* La tipografía original puede no estar en la lista de Google Fonts: se ofrece siempre. */}
        {!FONTS.some((font) => font.name === original) && (
          <button
            type="button"
            role="radio"
            aria-checked={current === original}
            onClick={() => onChange(null)}
            className={cn(
              `rounded-md border px-3 py-2.5 text-left transition ${ring}`,
              current === original ? "border-[#1e4b8e] bg-[#1e4b8e]/5 ring-1 ring-[#1e4b8e]" : "border-gray-200 bg-white hover:border-[#1e4b8e]/60",
            )}
          >
            <span className="block truncate text-lg leading-tight text-gray-900">{sample}</span>
            <span className="mt-1 flex items-center justify-between text-xs text-gray-500">
              {original}
              <span className="rounded bg-gray-100 px-1.5 py-0.5">Original</span>
            </span>
          </button>
        )}
        {visible.map((font) => {
          const active = font.name === current
          return (
            <button
              key={font.name}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(font.name === original ? null : font.name)}
              className={cn(
                `rounded-md border px-3 py-2.5 text-left transition ${ring}`,
                active ? "border-[#1e4b8e] bg-[#1e4b8e]/5 ring-1 ring-[#1e4b8e]" : "border-gray-200 bg-white hover:border-[#1e4b8e]/60",
              )}
            >
              <span className="block truncate text-lg leading-tight text-gray-900" style={{ fontFamily: `"${font.name}", sans-serif` }}>
                {sample}
              </span>
              <span className="mt-1 flex items-center justify-between text-xs text-gray-500">
                {font.name}
                {font.name === original && <span className="rounded bg-gray-100 px-1.5 py-0.5">Original</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Subir una imagen (PNG, JPG o WebP) o volver a la original. */
export function ImageField({
  label,
  value,
  onChange,
  fallback,
  clearLabel,
}: {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  fallback?: string
  clearLabel?: string
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shown = value ?? fallback ?? null

  async function upload(file: File) {
    setError(null)
    setUploading(true)
    try {
      onChange(await uploadBackofficeImage(file))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo subir la imagen")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-6 w-6 text-gray-400" aria-hidden />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void upload(file)
            }}
          />
          <button type="button" className={btnOutline} disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
            {uploading ? "Subiendo…" : "Subir imagen"}
          </button>
          {value && clearLabel && (
            <button type="button" className={btnOutline} onClick={() => onChange(null)}>
              <X className="h-4 w-4" aria-hidden />
              {clearLabel}
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500">PNG, JPG o WebP. Se optimiza sola al subirla.</p>
      <ErrorNote message={error} />
    </div>
  )
}

export { BLUE }
