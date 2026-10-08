import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { OrdersManager } from "@/components/backoffice/orders-manager"
import { getStoreInfo } from "@/lib/db"
import { listOrders } from "@/lib/server/orders"

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const [{ estado }, orders, store] = await Promise.all([searchParams, listOrders({ limit: 200 }), getStoreInfo()])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-[#1e4b8e] text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
          <Link href="/backoffice" aria-label="Volver al panel" className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="title-font truncate text-2xl leading-tight md:text-3xl">Pedidos</h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <OrdersManager initial={orders} initialFilter={estado === "pendientes" ? "pendientes" : "todos"} storeName={store.siteName} />
      </main>
    </div>
  )
}
