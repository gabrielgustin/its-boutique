import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ThemeEditor } from "@/components/backoffice/theme-editor"
import { getTheme } from "@/lib/db"

export default async function PersonalizarPage() {
  const theme = await getTheme()

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-[#1e4b8e] text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
          <Link href="/backoffice" aria-label="Volver al panel" className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="title-font truncate text-2xl leading-tight md:text-3xl">Personaliza tu App</h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <ThemeEditor initial={theme} />
      </main>
    </div>
  )
}
