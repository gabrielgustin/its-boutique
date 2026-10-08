-- Catálogo de ejemplo para que la tienda se vea completa desde el primer día.
-- Solo se carga si todavía no hay ninguna categoría: si ya cargaste las tuyas, no toca nada.
-- Se borra desde el backoffice (Categorías y Productos) cuando quieras.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categorias) THEN
    INSERT INTO categorias (id, nombre, imagen, orden) VALUES
      ('indumentaria', 'Indumentaria', '/demo/cat-indumentaria.svg', 0),
      ('accesorios', 'Accesorios', '/demo/cat-accesorios.svg', 1),
      ('calzado', 'Calzado', '/demo/cat-calzado.svg', 2),
      ('perfumeria', 'Perfumería', '/demo/cat-perfumeria.svg', 3);

    INSERT INTO subcategorias (id, nombre, categoria_id) VALUES
      ('remeras', 'Remeras', 'indumentaria'),
      ('abrigos', 'Abrigos', 'indumentaria'),
      ('vestidos', 'Vestidos', 'indumentaria'),
      ('pantalones', 'Pantalones', 'indumentaria'),
      ('bolsos', 'Bolsos', 'accesorios'),
      ('bijouterie', 'Bijouterie', 'accesorios');

    INSERT INTO productos (id, nombre, descripcion, precio, imagen, categoria, subcategoria, descuento, orden) VALUES
      ('remera-basica', 'Remera básica de algodón', 'Remera de algodón peinado, corte clásico. Ideal para todos los días.', 18000, '/demo/remera.svg', 'indumentaria', 'remeras', 20, 0),
      ('campera-denim', 'Campera de jean', 'Campera de denim con lavado vintage y botones metálicos.', 65000, '/demo/campera.svg', 'indumentaria', 'abrigos', 0, 1),
      ('vestido-lino', 'Vestido de lino', 'Vestido midi de lino, fresco y liviano. Con lazo en la cintura.', 54000, '/demo/vestido.svg', 'indumentaria', 'vestidos', 15, 2),
      ('pantalon-sastrero', 'Pantalón sastrero', 'Pantalón de tiro alto y pierna recta, con pinzas.', 47000, '/demo/pantalon.svg', 'indumentaria', 'pantalones', 0, 3),
      ('bolso-cuero', 'Bolso de cuero', 'Bolso de cuero ecológico con cierre y bolsillo interno.', 48000, '/demo/bolso.svg', 'accesorios', 'bolsos', 0, 0),
      ('collar-dorado', 'Collar dorado', 'Collar con baño de oro 18k y dije circular.', 12500, '/demo/collar.svg', 'accesorios', 'bijouterie', 0, 1),
      ('anteojos-sol', 'Anteojos de sol', 'Marco de acetato y lentes con filtro UV400.', 29000, '/demo/anteojos.svg', 'accesorios', '', 10, 2),
      ('zapatillas-urbanas', 'Zapatillas urbanas', 'Zapatillas livianas de lona con suela de goma.', 72000, '/demo/zapatillas.svg', 'calzado', '', 0, 0),
      ('botas-cuero', 'Botas de cuero', 'Botas de caña corta con cierre lateral.', 98000, '/demo/botas.svg', 'calzado', '', 0, 1),
      ('perfume-floral', 'Perfume floral 50 ml', 'Fragancia floral suave con notas de jazmín y peonía.', 39000, '/demo/perfume.svg', 'perfumeria', '', 10, 0),
      ('crema-manos', 'Crema de manos', 'Crema hidratante con manteca de karité. 75 ml.', 8500, '/demo/crema.svg', 'perfumeria', '', 0, 1);

    INSERT INTO producto_variantes (producto_id, nombre, precio) VALUES
      ('remera-basica', 'S', 18000), ('remera-basica', 'M', 18000), ('remera-basica', 'L', 18000), ('remera-basica', 'XL', 18000),
      ('campera-denim', 'S', 65000), ('campera-denim', 'M', 65000), ('campera-denim', 'L', 65000),
      ('vestido-lino', 'S', 54000), ('vestido-lino', 'M', 54000), ('vestido-lino', 'L', 54000),
      ('pantalon-sastrero', '38', 47000), ('pantalon-sastrero', '40', 47000), ('pantalon-sastrero', '42', 47000),
      ('zapatillas-urbanas', '37', 72000), ('zapatillas-urbanas', '38', 72000), ('zapatillas-urbanas', '39', 72000), ('zapatillas-urbanas', '40', 72000),
      ('botas-cuero', '37', 98000), ('botas-cuero', '38', 98000), ('botas-cuero', '39', 98000);

    INSERT INTO producto_imagenes (producto_id, url, orden) VALUES
      ('remera-basica', '/demo/cat-indumentaria.svg', 0),
      ('vestido-lino', '/demo/cat-indumentaria.svg', 0);
  END IF;
END
$$;
