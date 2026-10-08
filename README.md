# ITS Boutique

Tienda online (catálogo + carrito + pedidos) con panel de administración, hecha con Next.js 16, React 19 y Tailwind 4.

- **Tienda:** `/`: categorías, productos con talles, carrito, checkout, seguimiento del pedido (`/pedido/<enlace>`), instalable como app (PWA).
- **Backoffice:** `/backoffice`: pedidos, productos, categorías, cupones, horarios, formas de entrega y pago, QR y **Personaliza tu App** (colores, tipografías, formas, logo y textos con vista previa en vivo).

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:3000
```

Sin configurar nada usa **PGlite** (un Postgres embebido que guarda en `./data`), con un catálogo de ejemplo y un administrador de prueba definido en `.env.local` (`DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD`). Es el mismo motor y el mismo SQL que en producción.

## Conectar la base de datos real

1. Crear una base Postgres (Neon, Supabase, RDS…).
2. Definir las variables (ver `.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL` y `BLOB_READ_WRITE_TOKEN` para las imágenes.
3. `npm run build` aplica solo las migraciones de `db/migrations` antes de compilar (o `npm run db:migrate` a mano).
4. Abrir `/backoffice/setup` **una vez** para crear el administrador. Después queda cerrado.

No hay que tocar código: `lib/sql.ts` elige PGlite o Postgres según exista `DATABASE_URL`.

## Estructura

| Carpeta | Qué hay |
|---|---|
| `app/(tienda)` | Pantallas públicas |
| `app/backoffice` | Panel de administración (protegido por sesión) |
| `app/api` | `/api/orders`, `/api/coupons/validate`, `/api/search` (públicas) y `/api/backoffice/*` (solo con sesión) |
| `lib/sql.ts` | Única puerta a la base de datos (+ migraciones y datos demo en local) |
| `lib/db.ts` | Lecturas públicas con caché; cualquier escritura la invalida sola |
| `lib/server/orders.ts` | Crear pedidos: valida y recalcula **todo** en el servidor (precios, cupón y envío) |
| `lib/pricing.ts`, `lib/hours.ts`, `lib/theme.ts` | Reglas puras, con tests en `tests/` |
| `db/migrations` | Esquema SQL versionado |

## Seguridad

- Las rutas de administración exigen sesión (`requireBackofficeSession`); `proxy.ts` solo hace un filtro previo.
- El navegador nunca decide un precio: el pedido se recalcula en el servidor.
- Cupones y pedidos tienen límite de intentos por IP (`lib/server/rate-limit.ts`; en serverless conviene pasarlo a Redis/Upstash).
- Cabeceras de seguridad en `next.config.mjs`. El diseño se valida con listas cerradas antes de llegar al CSS.

## Comandos

`npm run dev` · `npm run build` · `npm run check` (tipos + tests) · `npm run db:migrate`

`_archivo/` guarda los archivos del proyecto original que ya no se usan (no se compila ni se sube).
