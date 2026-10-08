import type { Metadata } from "next"
import { CheckoutForm } from "@/components/store/checkout-form"
import { PageBody, TitleBar } from "@/components/store/title-bar"
import { canOrderNow, getCheckoutOptions } from "@/lib/db"

export const metadata: Metadata = { title: "Finalizar pedido", robots: { index: false } }

export default async function CheckoutPage() {
  const [options, status] = await Promise.all([getCheckoutOptions(), canOrderNow()])

  return (
    <>
      <TitleBar title="Finalizar pedido" backHref="/carrito" />
      <PageBody>
        <CheckoutForm options={options} canOrder={status.canOrder} />
      </PageBody>
    </>
  )
}
