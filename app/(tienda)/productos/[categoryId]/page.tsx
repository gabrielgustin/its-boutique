import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CategoryProducts } from "@/components/store/catalog"
import { getCategoryById, getProductsByCategory, getSubcategoriesByCategory } from "@/lib/db"

type Props = { params: Promise<{ categoryId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryById((await params).categoryId)
  return category ? { title: category.title, openGraph: { title: category.title, images: [category.image_url] } } : {}
}

export default async function CategoryPage({ params }: Props) {
  const { categoryId } = await params
  const [category, products, subcategories] = await Promise.all([getCategoryById(categoryId), getProductsByCategory(categoryId), getSubcategoriesByCategory(categoryId)])
  if (!category) notFound()

  return <CategoryProducts title={category.title} products={products} subcategories={subcategories} />
}
