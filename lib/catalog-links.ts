// Un producto puede no tener categoría. La dirección de un producto lleva siempre la categoría
// (/productos/<categoría>/<producto>), así que a esos productos se les pone este nombre.
export const NO_CATEGORY = "otros"

export const productHref = (product: { category_id: string; id: string }) => `/productos/${product.category_id || NO_CATEGORY}/${product.id}`
