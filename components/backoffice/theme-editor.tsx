"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Image as ImageIcon, LayoutTemplate, MessageSquareText, Palette, RotateCcw, SlidersHorizontal, TriangleAlert, Type } from "lucide-react"
import {
  ColorRow, ErrorNote, Field, FontPicker, Group, ImageField, Segmented, ToggleRow,
  btnDanger, btnOutline, btnPrimary, inputClass,
} from "@/components/backoffice/theme-ui"
import { PREVIEW_MESSAGE, PREVIEW_READY } from "@/components/site-theme"
import {
  BUTTONS, CATEGORY_LAYOUTS, COLOR_DEFS, CORNERS, IMAGE_RATIOS, PRODUCT_LAYOUTS, DEFAULT_BODY_FONT, DEFAULT_HEADING_FONT, DEFAULT_LOGO_URL, DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_NAME,
  DEFAULT_THEME, FONTS, HEADING_CASES, HEADING_SPACINGS, LOGO_ALIGNS, LOGO_SIZES, PRESETS, TEXT_DEFS, TEXT_SCALES,
  applyPreset, contrastRatio, googleFontsHref, resolveColor,
  type ColorGroup, type ColorKey, type TextKey, type ThemeSettings,
} from "@/lib/theme"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "plantillas", label: "Plantillas", Icon: LayoutTemplate },
  { id: "colores", label: "Colores", Icon: Palette },
  { id: "tipografia", label: "Tipografía", Icon: Type },
  { id: "estilo", label: "Formas y diseño", Icon: SlidersHorizontal },
  { id: "imagenes", label: "Logo e imágenes", Icon: ImageIcon },
  { id: "textos", label: "Textos", Icon: MessageSquareText },
] as const

type TabId = (typeof TABS)[number]["id"]

const COLOR_GROUPS: ColorGroup[] = ["Marca", "Fondos", "Textos", "Botones y menú"]

// Pares que tienen que leerse bien: [texto, fondo, descripción].
const CONTRAST_CHECKS: [ColorKey, ColorKey, string][] = [
  ["foreground", "pageBg", "El texto sobre el fondo de la tienda"],
  ["foreground", "card", "El texto sobre las tarjetas"],
  ["heading", "pageBg", "Los títulos sobre el fondo de la tienda"],
  ["price", "pageBg", "Los precios sobre el fondo de la tienda"],
  ["mutedText", "pageBg", "Los textos secundarios sobre el fondo"],
  ["buttonText", "button", "El texto de los botones"],
]

export function ThemeEditor({ initial }: { initial: ThemeSettings }) {
  const router = useRouter()
  const [draft, setDraft] = useState(initial)
  const [baseline, setBaseline] = useState(initial)
  const [tab, setTab] = useState<TabId>("plantillas")
  const [confirmReset, setConfirmReset] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)

  const change = useCallback((patch: Partial<ThemeSettings>) => {
    setSaved(false)
    setDraft((current) => ({ ...current, ...patch }))
  }, [])

  // Avisa antes de cerrar la pestaña si hay cambios sin guardar.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const warnings = useMemo(
    () =>
      CONTRAST_CHECKS.filter(([text, background]) => contrastRatio(resolveColor(draft, text), resolveColor(draft, background)) < 4.5).map(
        ([, , description]) => description,
      ),
    [draft],
  )

  async function save() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/backoffice/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar")
      setBaseline(draft)
      setSaved(true)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar")
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      {/* Todas las tipografías, para poder mostrar cada una escrita con su letra. */}
      <link rel="stylesheet" href={googleFontsHref(FONTS.map((font) => font.name))!} />

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8">
        <div className="min-w-0 space-y-5">
          <div role="tablist" aria-label="Secciones del diseño" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                id={`tab-${id}`}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4b8e]/50",
                  tab === id ? "bg-[#1e4b8e] text-white" : "bg-gray-100 text-gray-600 hover:text-gray-900",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-5">
            {tab === "plantillas" && (
              <TemplatesTab
                draft={draft}
                onApply={(next) => {
                  setSaved(false)
                  setDraft(next)
                }}
              />
            )}
            {tab === "colores" && <ColorsTab draft={draft} warnings={warnings} change={change} />}
            {tab === "tipografia" && <TypographyTab draft={draft} change={change} />}
            {tab === "estilo" && <StyleTab draft={draft} change={change} />}
            {tab === "imagenes" && <ImagesTab draft={draft} change={change} />}
            {tab === "textos" && <TextsTab draft={draft} change={change} />}
          </div>

          <div className="sticky bottom-3 z-20 space-y-3 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
            <ErrorNote message={error} />
            <div className="flex flex-wrap items-center gap-3">
              <p role="status" className="min-w-0 flex-1 basis-48 text-sm">
                {dirty ? (
                  <span className="font-medium text-amber-700">Tenés cambios sin guardar</span>
                ) : saved ? (
                  <span className="font-medium text-emerald-700">Cambios guardados: ya se ven en la tienda</span>
                ) : (
                  <span className="text-gray-500">Los cambios se ven al instante en la vista previa</span>
                )}
              </p>
              <button type="button" className={btnOutline} disabled={pending} onClick={() => setConfirmReset(true)}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                Restablecer todo
              </button>
              <button
                type="button"
                className={btnOutline}
                disabled={pending || !dirty}
                onClick={() => {
                  setDraft(baseline)
                  setSaved(false)
                }}
              >
                Descartar
              </button>
              <button type="button" className={btnPrimary} disabled={pending || !dirty} onClick={save}>
                {pending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>

        <LivePreview theme={draft} />
      </div>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-xl">
            <h2 id="reset-title" className="text-xl font-semibold text-gray-900">
              ¿Volver al diseño original?
            </h2>
            <p className="text-sm leading-6 text-gray-600">
              Se restablecen colores, tipografías, formas, imágenes y textos. Podés revisarlo en la vista previa y, si no te convence, descartar los cambios antes de guardar.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" className={btnOutline} onClick={() => setConfirmReset(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className={btnDanger}
                onClick={() => {
                  setSaved(false)
                  setDraft(DEFAULT_THEME)
                  setConfirmReset(false)
                }}
              >
                Restablecer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ───────────── Vista previa ─────────────

// La vista previa es la tienda real dentro de un iframe: recibe el borrador por
// postMessage, así que se ve exactamente igual que después de guardar.
// Simula un iPhone 17 Pro: pantalla de 402 × 874 puntos, que se achica si el monitor es bajo.
const SCREEN_W = 402
const SCREEN_H = 874
const BEZEL = 12
const PHONE_W = SCREEN_W + BEZEL * 2
const PHONE_H = SCREEN_H + BEZEL * 2

function LivePreview({ theme }: { theme: ThemeSettings }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [scale, setScale] = useState(1)

  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, theme }, window.location.origin)
  }, [theme])

  useEffect(send, [send])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === PREVIEW_READY) send()
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [send])

  useEffect(() => {
    const fit = () => {
      const byWidth = (window.innerWidth - 32) / PHONE_W
      const byHeight = window.innerWidth >= 768 ? (window.innerHeight - 190) / PHONE_H : 1
      setScale(Math.max(0.5, Math.min(1, byWidth, byHeight)))
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [])

  return (
    <aside aria-label="Vista previa" className="mx-auto md:sticky md:top-24 md:mx-0" style={{ width: PHONE_W * scale }}>
      <p className="mb-2 text-sm font-medium text-gray-800">Vista previa en vivo · iPhone 17 Pro</p>
      <div style={{ width: PHONE_W * scale, height: PHONE_H * scale }}>
        <div
          className="relative rounded-[62px] shadow-[0_30px_60px_-20px_rgba(15,23,42,0.55),inset_0_0_0_1.5px_rgba(255,255,255,0.28)]"
          style={{
            width: PHONE_W,
            height: PHONE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            background: "linear-gradient(145deg, #5b6a88 0%, #2c3750 38%, #1d2538 62%, #4a5877 100%)",
          }}
        >
          <span aria-hidden className="absolute -left-[3px] top-[118px] h-8 w-[3px] rounded-l bg-[#3b4760]" />
          <span aria-hidden className="absolute -left-[3px] top-[176px] h-14 w-[3px] rounded-l bg-[#3b4760]" />
          <span aria-hidden className="absolute -left-[3px] top-[248px] h-14 w-[3px] rounded-l bg-[#3b4760]" />
          <span aria-hidden className="absolute -right-[3px] top-[200px] h-24 w-[3px] rounded-r bg-[#3b4760]" />

          <div className="absolute rounded-[54px] bg-black" style={{ inset: 5 }} />
          <div className="absolute overflow-hidden rounded-[50px] bg-white" style={{ inset: BEZEL, width: SCREEN_W, height: SCREEN_H }}>
            <iframe ref={frame} src="/" title="Vista previa de la tienda" onLoad={send} className="block border-0 bg-white" style={{ width: SCREEN_W, height: SCREEN_H }} />
          </div>

          <span aria-hidden className="pointer-events-none absolute left-1/2 h-[34px] w-[120px] -translate-x-1/2 rounded-full bg-black" style={{ top: BEZEL + 11 }} />
          <span aria-hidden className="pointer-events-none absolute left-1/2 h-[5px] w-[136px] -translate-x-1/2 rounded-full bg-black/75 ring-1 ring-white/40" style={{ bottom: BEZEL + 8 }} />
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">Tocá y desplazate dentro como lo haría un cliente. Los cambios se ven al instante.</p>
    </aside>
  )
}

// ───────────── Pestañas ─────────────

type TabProps = { draft: ThemeSettings; change: (patch: Partial<ThemeSettings>) => void }

function TemplatesTab({ draft, onApply }: { draft: ThemeSettings; onApply: (theme: ThemeSettings) => void }) {
  return (
    <Group title="Plantillas" description="Un punto de partida: cambia colores, tipografías y formas, y después podés ajustar lo que quieras. Tu logo, imágenes y textos no se tocan.">
      <div className="grid gap-3 sm:grid-cols-2">
        {PRESETS.map((preset) => {
          const sample = applyPreset(draft, preset)
          const colors = (["primary", "pageBg", "card", "secondary"] as const).map((key) => resolveColor(sample, key))
          const headingFont = sample.headingFont ?? DEFAULT_HEADING_FONT
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApply(sample)}
              className="rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-[#1e4b8e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4b8e]/50"
            >
              <span className="flex h-14 overflow-hidden rounded-md border border-gray-200" aria-hidden>
                {colors.map((color, index) => (
                  <span key={index} className="flex-1" style={{ backgroundColor: color }} />
                ))}
              </span>
              <span className="mt-2 block text-lg leading-tight text-gray-900" style={{ fontFamily: `"${headingFont}", serif` }}>
                {preset.name}
              </span>
              <span className="block text-xs text-gray-500">{preset.description}</span>
            </button>
          )
        })}
      </div>
    </Group>
  )
}

function ColorsTab({ draft, warnings, change }: TabProps & { warnings: string[] }) {
  return (
    <>
      {warnings.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Algunos textos se leen con dificultad:</p>
            <ul className="mt-1 list-disc pl-5">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {COLOR_GROUPS.map((group) => (
        <Group key={group} title={group}>
          <div className="divide-y divide-gray-100">
            {COLOR_DEFS.filter((def) => def.group === group).map((def) => (
              <ColorRow key={def.key} def={def} theme={draft} onChange={(value) => change({ [def.key]: value })} />
            ))}
          </div>
        </Group>
      ))}
    </>
  )
}

function TypographyTab({ draft, change }: TabProps) {
  return (
    <>
      <Group title="Tipografías" description="Cada tipografía se muestra con su propia letra.">
        <FontPicker
          label="Títulos"
          hint="Títulos de las pantallas y nombres de categorías y productos."
          value={draft.headingFont}
          original={DEFAULT_HEADING_FONT}
          sample="Indumentaria"
          onChange={(value) => change({ headingFont: value })}
        />
        <hr className="border-gray-200" />
        <FontPicker
          label="Textos"
          hint="Descripciones, buscador, carrito y formularios."
          value={draft.bodyFont}
          original={DEFAULT_BODY_FONT}
          sample="Remera de algodón premium"
          onChange={(value) => change({ bodyFont: value })}
        />
      </Group>
      <Group title="Ajustes de texto">
        <Segmented label="Letras de los títulos" options={HEADING_CASES} value={draft.headingCase} onChange={(value) => change({ headingCase: value })} />
        <Segmented label="Separación entre letras de los títulos" options={HEADING_SPACINGS} value={draft.headingSpacing} onChange={(value) => change({ headingSpacing: value })} />
        <Segmented label="Tamaño de todos los textos" hint="Agranda o achica la tienda entera." options={TEXT_SCALES} value={draft.textScale} onChange={(value) => change({ textScale: value })} />
      </Group>
    </>
  )
}

function StyleTab({ draft, change }: TabProps) {
  return (
    <>
      <Group title="Catálogo">
        <Segmented label="Cómo se muestran las categorías" options={CATEGORY_LAYOUTS} value={draft.categoryLayout} onChange={(value) => change({ categoryLayout: value })} />
        <Segmented label="Cómo se muestran los productos" options={PRODUCT_LAYOUTS} value={draft.productLayout} onChange={(value) => change({ productLayout: value })} />
        <Segmented label="Forma de las fotos" options={IMAGE_RATIOS} value={draft.imageRatio} onChange={(value) => change({ imageRatio: value })} />
      </Group>
      <Group title="Formas">
        <Segmented label="Esquinas de tarjetas y fotos" options={CORNERS} value={draft.corners} onChange={(value) => change({ corners: value })} />
        <Segmented label="Botones principales" options={BUTTONS} value={draft.buttons} onChange={(value) => change({ buttons: value })} />
      </Group>
      <Group title="Logo">
        <Segmented label="Tamaño del logo" options={LOGO_SIZES} value={draft.logoSize} onChange={(value) => change({ logoSize: value })} />
        <Segmented label="Posición del logo" options={LOGO_ALIGNS} value={draft.logoAlign} onChange={(value) => change({ logoAlign: value })} />
      </Group>
      <Group title="Qué se muestra">
        <ToggleRow label="Buscador de productos" checked={draft.showSearch} onChange={(value) => change({ showSearch: value })} />
        <ToggleRow label="Etiqueta “Hasta X% OFF” en las categorías" checked={draft.showDiscountBadge} onChange={(value) => change({ showDiscountBadge: value })} />
      </Group>
    </>
  )
}

function ImagesTab({ draft, change }: TabProps) {
  return (
    <>
      <Group title="En la tienda">
        <ImageField label="Logo del encabezado" value={draft.logoUrl} fallback={DEFAULT_LOGO_URL} clearLabel="Volver al logo original" removeBackground onChange={(url) => change({ logoUrl: url })} />
      </Group>
      <Group title="En el navegador y al compartir">
        <ImageField label="Ícono de la pestaña (favicon)" value={draft.faviconUrl} clearLabel="Volver al original" onChange={(url) => change({ faviconUrl: url })} />
        <ImageField label="Imagen al compartir el enlace" value={draft.shareImageUrl} clearLabel="Quitar imagen" onChange={(url) => change({ shareImageUrl: url })} />
      </Group>
    </>
  )
}

function TextsTab({ draft, change }: TabProps) {
  const setText = (key: TextKey, value: string) => {
    const texts = { ...draft.texts }
    if (value) texts[key] = value
    else delete texts[key]
    change({ texts })
  }

  return (
    <>
      <Group title="Datos del sitio" description="Aparecen en la pestaña del navegador y al compartir el enlace.">
        <Field label="Nombre del negocio">
          <input className={inputClass} maxLength={60} placeholder={DEFAULT_SITE_NAME} value={draft.siteName ?? ""} onChange={(event) => change({ siteName: event.target.value || null })} />
        </Field>
        <Field label="Descripción">
          <textarea
            className={`${inputClass} h-20 resize-none py-2.5 leading-6`}
            maxLength={200}
            placeholder={DEFAULT_SITE_DESCRIPTION}
            value={draft.siteDescription ?? ""}
            onChange={(event) => change({ siteDescription: event.target.value || null })}
          />
        </Field>
      </Group>
      <Group title="Textos de la tienda" description="Si dejás un campo vacío se usa el texto original.">
        {TEXT_DEFS.map((def) => (
          <Field key={def.key} label={def.label} hint={def.where}>
            <input className={inputClass} maxLength={60} placeholder={def.original} value={draft.texts[def.key] ?? ""} onChange={(event) => setText(def.key, event.target.value)} />
          </Field>
        ))}
      </Group>
    </>
  )
}
