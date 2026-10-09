-- Las subcategorías se pueden ordenar a gusto desde el backoffice.
-- Se parte del orden alfabético que tenían hasta ahora, dentro de cada categoría.
ALTER TABLE subcategorias ADD COLUMN IF NOT EXISTS orden INTEGER;

UPDATE subcategorias s
SET orden = r.posicion
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY categoria_id ORDER BY nombre ASC, created_at ASC) - 1 AS posicion
  FROM subcategorias
) r
WHERE s.id = r.id AND s.orden IS NULL;
