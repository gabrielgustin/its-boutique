import Link from "next/link"
import { PageBody, TitleBar } from "@/components/store/title-bar"

export default function NotFound() {
  return (
    <>
      <TitleBar title="No encontrado" backHref="/" />
      <PageBody narrow>
        <div className="st-raised px-6 py-14 text-center">
          <p className="st-title text-6xl text-st-heading">404</p>
          <p className="mt-3 text-xl font-bold text-st-heading">No encontramos esta página</p>
          <p className="mt-1 text-sm text-st-muted">Puede que el producto ya no esté disponible o que el enlace sea incorrecto.</p>
          <Link href="/" className="st-btn mt-6 st-focus">
            Ir al inicio
          </Link>
        </div>
      </PageBody>
    </>
  )
}
