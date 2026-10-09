import { CategoryGrid } from "@/components/store/catalog"
import { PageBody, TitleBar } from "@/components/store/title-bar"
import { HomeBanner } from "@/components/store/home-banner"
import { canOrderNow, getCategories, getPromoBannerConfig } from "@/lib/db"

export default async function HomePage() {
  const [categories, banner, status] = await Promise.all([getCategories(), getPromoBannerConfig(), canOrderNow()])

  return (
    <>
      <TitleBar title="" />
      <PageBody>
        <HomeBanner banner={banner} status={status} />
        <CategoryGrid categories={categories} />
      </PageBody>
    </>
  )
}
