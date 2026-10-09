import { CategoryGrid, ProductGrid } from "@/components/store/catalog"
import { PageBody, TitleBar } from "@/components/store/title-bar"
import { HomeBanner } from "@/components/store/home-banner"
import { canOrderNow, getCategories, getProducts, getPromoBannerConfig } from "@/lib/db"

export default async function HomePage() {
  const [categories, products, banner, status] = await Promise.all([getCategories(), getProducts(), getPromoBannerConfig(), canOrderNow()])
  // Productos sin categoría (o cuya categoría ya no existe): se muestran debajo de las categorías.
  const known = new Set(categories.map((category) => category.id))
  const loose = products.filter((product) => !known.has(product.category_id))

  return (
    <>
      <TitleBar title="" />
      <PageBody>
        <HomeBanner banner={banner} status={status} />
        <CategoryGrid categories={categories} />
        {loose.length > 0 && (
          <section className="mt-8">
            <h2 className="st-title mb-4 text-2xl text-st-heading">Otros productos</h2>
            <ProductGrid products={loose} />
          </section>
        )}
      </PageBody>
    </>
  )
}
