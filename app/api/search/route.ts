import { NextResponse } from "next/server"
import { searchProducts } from "@/lib/db"

export async function GET(request: Request) {
  const text = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? ""
  if (text.trim().length < 2) return NextResponse.json([])

  try {
    return NextResponse.json(await searchProducts(text))
  } catch (error) {
    console.error("[search] Error:", error)
    return NextResponse.json({ error: "No se pudo buscar" }, { status: 500 })
  }
}
