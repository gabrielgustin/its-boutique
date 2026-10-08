import Image, { type ImageProps } from "next/image"

// Las imágenes vectoriales y los marcadores de posición no pasan por el optimizador.
const skipOptimizer = (src: string) => src.endsWith(".svg") || src.startsWith("/placeholder")

export function StoreImage({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  return <Image src={src || "/placeholder.svg"} alt={alt} unoptimized={skipOptimizer(src || "/placeholder.svg")} {...props} />
}
