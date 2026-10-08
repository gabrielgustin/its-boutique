-- La tienda no maneja stock: se eliminan las columnas y los productos con talles
-- (variantes) quedan siempre disponibles.
ALTER TABLE productos DROP COLUMN IF EXISTS stock;
ALTER TABLE producto_variantes DROP COLUMN IF EXISTS stock;
