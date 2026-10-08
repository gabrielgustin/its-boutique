import { CategoryGrid } from "@/components/store/catalog"
import { PageBody, TitleBar } from "@/components/store/title-bar"
import { ClosedBanner, PromoBanner } from "@/components/store/banners"
import { canOrderNow, getCategories, getPromoBannerConfig } from "@/lib/db"

export default async function HomePage() {
  const [categories, banner, status] = await Promise.all([getCategories(), getPromoBannerConfig(), canOrderNow()])

  return (
    <>
      <TitleBar title="" />
      <PageBody>
        {!status.open ? <ClosedBanner canOrder={status.canOrder} /> : banner.enabled && banner.text ? <PromoBanner text={banner.text} /> : null}
        <CategoryGrid categories={categories} />
      </PageBody>
    </>
  )
}
