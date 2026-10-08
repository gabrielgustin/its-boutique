import type { Metadata } from "next"
import { CartView } from "@/components/store/cart-view"
import { PageBody, TitleBar } from "@/components/store/title-bar"

export const metadata: Metadata = { title: "Mi pedido", robots: { index: false } }

export default function CartPage() {
  return (
    <>
      <TitleBar title="Mi pedido" backHref="/" />
      <PageBody narrow>
        <CartView />
      </PageBody>
    </>
  )
}
