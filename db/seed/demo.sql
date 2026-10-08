-- Datos de ejemplo SOLO para desarrollo local (PGlite): cupón y datos de contacto ficticios.
-- El catálogo de ejemplo va por la migración 0004 y también llega a producción.
INSERT INTO coupons (code, discount_type, discount_value, start_date, end_date) VALUES
  ('BIENVENIDA10', 'percentage', 10, '2020-01-01', '2099-12-31');

UPDATE delivery_methods SET delivery_cost = 3000 WHERE name = 'Envío a domicilio';

UPDATE site_config SET config_value = '5491100000000' WHERE config_key = 'contact_whatsapp';
UPDATE site_config SET config_value = 'Av. Siempre Viva 123, Buenos Aires' WHERE config_key = 'store_location';
UPDATE site_config SET config_value = '¡Nueva colección disponible!' WHERE config_key = 'banner_text';
UPDATE site_config SET config_value = 'true' WHERE config_key = 'banner_enabled';
