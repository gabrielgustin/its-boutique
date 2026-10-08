-- ITS Boutique · esquema inicial
-- Catálogo, configuración de la tienda y pedidos.

CREATE TABLE categorias (
  id          TEXT PRIMARY KEY,
  nombre      TEXT NOT NULL,
  imagen      TEXT,
  visible     BOOLEAN NOT NULL DEFAULT TRUE,
  orden       INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subcategorias (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  categoria_id  TEXT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subcategorias_categoria ON subcategorias(categoria_id);

CREATE TABLE productos (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  descripcion   TEXT NOT NULL DEFAULT '',
  precio        INTEGER NOT NULL DEFAULT 0 CHECK (precio >= 0),          -- en pesos, sin centavos
  imagen        TEXT,
  categoria     TEXT NOT NULL DEFAULT '',                                -- id de categorias
  subcategoria  TEXT NOT NULL DEFAULT '',                                -- id de subcategorias
  marca         TEXT,
  descuento     INTEGER NOT NULL DEFAULT 0 CHECK (descuento BETWEEN 0 AND 100),
  stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  visible       BOOLEAN NOT NULL DEFAULT TRUE,
  orden         INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_visible ON productos(visible);

-- Talles, colores u otras opciones de un producto, cada una con su precio y stock.
CREATE TABLE producto_variantes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id  TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  precio       INTEGER NOT NULL DEFAULT 0 CHECK (precio >= 0),
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  orden        SERIAL,                                                   -- conserva el orden en que se cargaron
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_variantes_producto ON producto_variantes(producto_id);

-- Fotos extra de un producto (la principal sigue en productos.imagen).
CREATE TABLE producto_imagenes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id  TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  orden        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_imagenes_producto ON producto_imagenes(producto_id);

CREATE TABLE coupons (
  id              SERIAL PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  NUMERIC(10, 2) NOT NULL CHECK (discount_value >= 0),
  start_date      DATE,
  end_date        DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE delivery_methods (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  delivery_cost  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  is_required    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_methods (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuración clave/valor: datos del negocio, banner, QR y el diseño ("theme").
CREATE TABLE site_config (
  id            SERIAL PRIMARY KEY,
  config_key    TEXT NOT NULL UNIQUE,
  config_value  TEXT,
  description   TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE business_hours (
  id                     SERIAL PRIMARY KEY,
  day_of_week            TEXT NOT NULL,
  is_open                BOOLEAN NOT NULL DEFAULT TRUE,
  open_time              TEXT,
  close_time             TEXT,
  additional_open_time   TEXT,
  additional_close_time  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE business_hours_config (
  id                        SERIAL PRIMARY KEY,
  allow_orders_when_closed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────── Pedidos ─────────────

CREATE TABLE pedidos (
  id                 SERIAL PRIMARY KEY,
  token              UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),       -- enlace público de seguimiento
  estado             TEXT NOT NULL DEFAULT 'nuevo'
                     CHECK (estado IN ('nuevo', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado')),
  cliente_nombre     TEXT NOT NULL,
  cliente_telefono   TEXT NOT NULL,
  cliente_direccion  TEXT,
  notas              TEXT,
  forma_entrega      TEXT NOT NULL,
  metodo_pago        TEXT NOT NULL,
  subtotal           INTEGER NOT NULL,
  descuento          INTEGER NOT NULL DEFAULT 0,
  cupon_codigo       TEXT,
  costo_envio        INTEGER NOT NULL DEFAULT 0,
  total              INTEGER NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pedidos_created ON pedidos(created_at DESC);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);

-- Cada renglón guarda nombre y precio tal como eran al comprar: el pedido no cambia
-- aunque después se edite o se borre el producto.
CREATE TABLE pedido_items (
  id               SERIAL PRIMARY KEY,
  pedido_id        INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id      TEXT,
  variante_id      UUID,
  nombre           TEXT NOT NULL,
  variante_nombre  TEXT,
  imagen           TEXT,
  precio_unitario  INTEGER NOT NULL,
  cantidad         INTEGER NOT NULL CHECK (cantidad > 0),
  observacion      TEXT
);
CREATE INDEX idx_pedido_items_pedido ON pedido_items(pedido_id);

-- ───────────── Datos mínimos para que la tienda funcione ─────────────

INSERT INTO business_hours (day_of_week, is_open, open_time, close_time) VALUES
  ('lunes', TRUE, '09:00', '20:00'),
  ('martes', TRUE, '09:00', '20:00'),
  ('miercoles', TRUE, '09:00', '20:00'),
  ('jueves', TRUE, '09:00', '20:00'),
  ('viernes', TRUE, '09:00', '20:00'),
  ('sabado', TRUE, '09:00', '14:00'),
  ('domingo', FALSE, '09:00', '14:00');

INSERT INTO business_hours_config (allow_orders_when_closed) VALUES (TRUE);

INSERT INTO payment_methods (name, is_default) VALUES ('Transferencia', TRUE), ('Efectivo', FALSE);

INSERT INTO delivery_methods (name, delivery_cost, is_default, is_required) VALUES
  ('Retiro en el local', 0, TRUE, TRUE),
  ('Envío a domicilio', 0, FALSE, FALSE);

INSERT INTO site_config (config_key, config_value, description) VALUES
  ('site_name', 'ITS Boutique', 'Nombre de la tienda'),
  ('store_logo', '', 'Logo de la tienda'),
  ('contact_whatsapp', '', 'WhatsApp que recibe los pedidos'),
  ('store_location', '', 'Dirección del local'),
  ('store_location_lat', '', 'Latitud del local'),
  ('store_location_lng', '', 'Longitud del local'),
  ('website_url', '', 'Sitio web'),
  ('instagram_url', '', 'Instagram'),
  ('facebook_url', '', 'Facebook'),
  ('banner_text', '', 'Texto del banner promocional'),
  ('banner_enabled', 'false', 'Mostrar el banner promocional');
