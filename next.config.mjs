/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "blob.vercel-storage.com" },
    ],
  },
  // Paquetes con binarios o WASM: se cargan desde node_modules, sin empaquetar.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          // La vista previa de "Personaliza tu App" muestra la tienda en un iframe del mismo sitio.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ]
  },
}

export default nextConfig
