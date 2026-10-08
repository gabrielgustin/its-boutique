const imageUrlCache = new Map<string, string>()

/**
 * Devuelve una URL de imagen válida o una imagen genérica si la URL es inválida
 * @param imageUrl URL de la imagen
 * @param productType Tipo de producto para seleccionar una imagen genérica adecuada
 * @param productTitle Título del producto para personalizar la imagen de placeholder
 * @returns URL de imagen válida
 */
export function getValidImageUrl(
  imageUrl: string | undefined | null,
  productType = "generic",
  productTitle = "",
): string {
  const cacheKey = `${imageUrl}|${productType}|${productTitle}`
  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey)!
  }

  let result: string

  if (!imageUrl || imageUrl === "" || imageUrl.startsWith("data:image") || imageUrl.length > 500) {
    result = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(productTitle || productType)}`
  } else if (imageUrl.startsWith("/") || imageUrl.startsWith("https://") || imageUrl.startsWith("http://")) {
    result = imageUrl
  } else {
    result = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(productTitle || "product")}`
  }

  imageUrlCache.set(cacheKey, result)
  return result
}

export function clearImageCache() {
  imageUrlCache.clear()
}
