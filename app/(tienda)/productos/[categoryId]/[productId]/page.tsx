import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/store/product-detail"
import { PageBody, TitleBar } from "@/components/store/title-bar"
import { canOrderNow, getCategoryById, getProductById } from "@/lib/db"
import { NO_CATEGORY } from "@/lib/catalog-links"
import { unitPrice } from "@/lib/pricing"

type Props = { params: Promise<{ categoryId: string; productId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductById((await params).productId)
  if (!product) return {}
  const description = product.description.slice(0, 160) || undefined
  return { title: product.title, description, openGraph: { title: product.title, description, images: [product.image_url] } }
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params
  const [product, status] = await Promise.all([getProductById(productId), canOrderNow()])
  if (!product) notFound()

  const category = await getCategoryById(product.category_id)
  const backHref = category ? `/productos/${category.id}` : "/"

  // Datos estructurados: ayudan a Google a mostrar precio y disponibilidad.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    image: product.images,
    offers: {
      "@type": "Offer",
      priceCurrency: "ARS",
      price: unitPrice(product.price, product.discount),
      availability: "https://schema.org/InStock",
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <TitleBar title={product.title} backHref={backHref} share />
      <PageBody>
        <ProductDetail product={product} category={category ? { id: category.id, title: category.title } : { id: NO_CATEGORY, title: "Otros productos" }} canOrder={status.canOrder} />
      </PageBody>
    </>
  )
}
