"use client"

import { useStoreText, type TextKey } from "@/components/site-theme"

/** Un texto de la tienda que el dueño puede cambiar desde "Personaliza tu App". */
export function ThemedText({ textKey, original }: { textKey: TextKey; original: string }) {
  return <>{useStoreText(textKey, original)}</>
}
