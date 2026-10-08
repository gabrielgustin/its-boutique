import type { Metadata } from "next"
import { Clock, Facebook, Globe, Instagram, MapPin, MessageCircle } from "lucide-react"
import { PageBody, TitleBar } from "@/components/store/title-bar"
import { getBusinessHours, getStoreInfo, isOpenAt } from "@/lib/db"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Ubicación y horarios" }

const DAY_LABELS: Record<string, string> = { lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo" }

export default async function ContactPage() {
  const [store, hours] = await Promise.all([getStoreInfo(), getBusinessHours()])
  const open = isOpenAt(hours, new Date())
  const links = [
    { href: store.whatsappUrl, label: "WhatsApp", Icon: MessageCircle },
    { href: store.instagramUrl, label: "Instagram", Icon: Instagram },
    { href: store.facebookUrl, label: "Facebook", Icon: Facebook },
    { href: store.websiteUrl, label: "Sitio web", Icon: Globe },
  ].filter((link) => link.href)

  return (
    <>
      <TitleBar title="Información" backHref="/" />
      <PageBody>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="st-card p-5">
          <h2 className="st-heading mb-3 flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-st-primary" aria-hidden /> Horarios
            <span className={cn("ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold", open ? "bg-emerald-100 text-emerald-800" : "bg-st-text/10 text-st-muted")}>{open ? "Abierto ahora" : "Cerrado ahora"}</span>
          </h2>
          {hours.length === 0 ? (
            <p className="text-sm text-st-muted">Todavía no hay horarios cargados.</p>
          ) : (
            <dl className="divide-y divide-st-border text-sm">
              {hours.map((day) => (
                <div key={day.id} className="flex justify-between gap-4 py-2.5">
                  <dt className="font-medium">{DAY_LABELS[day.day_of_week.toLowerCase()] ?? day.day_of_week}</dt>
                  <dd className="text-right text-st-muted">
                    {!day.is_open ? "Cerrado" : `${day.open_time} a ${day.close_time}${day.additional_open_time && day.additional_close_time ? ` · ${day.additional_open_time} a ${day.additional_close_time}` : ""}`}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <div className="space-y-5">
          {store.address && (
            <section className="st-card p-5">
              <h2 className="st-heading mb-2 flex items-center gap-2 text-lg font-semibold">
                <MapPin className="h-5 w-5 text-st-primary" aria-hidden /> Dónde estamos
              </h2>
              <p className="text-sm">{store.address}</p>
              {store.mapUrl && (
                <a href={store.mapUrl} target="_blank" rel="noopener noreferrer" className="st-btn-outline mt-4 st-focus">
                  Cómo llegar
                </a>
              )}
            </section>
          )}

          {links.length > 0 && (
            <section className="st-card p-5">
              <h2 className="st-heading mb-3 text-lg font-semibold">Contacto</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {links.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a href={href!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-st-btn border border-st-border px-4 py-3 text-sm font-medium transition hover:border-st-primary hover:text-st-primary st-focus">
                      <Icon className="h-5 w-5 text-st-primary" aria-hidden />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
      </PageBody>
    </>
  )
}
