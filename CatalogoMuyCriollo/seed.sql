-- Limpieza inicial (Opcional, cuidado en producción)
-- DELETE FROM product_images;
-- DELETE FROM product_variants;
-- DELETE FROM products;
-- DELETE FROM categories;
-- DELETE FROM brands;

-- Insert Brands
INSERT INTO brands (name) VALUES 
('Lagomarsino'), 
('Muy Criollo'), 
('La Mission');

-- Insert Categories
INSERT INTO categories (name, slug) VALUES 
('Sombreros', 'sombreros'), 
('Camperas de Cuero', 'camperas-de-cuero'), 
('Cuchillería', 'cuchilleria'),
('Cinturones', 'cinturones'),
('Billeteras', 'billeteras'),
('Estuches para sombreros', 'estuches-para-sombreros');

-- Productos de Ejemplo (Opcional)
INSERT INTO products (name, description, price, category_id, brand_id)
SELECT 
  'Sombrero Lagomarsino Clasico', 
  'Sombrero de fieltro de lana, ala de 8cm.', 
  125000, 
  (SELECT id FROM categories WHERE slug = 'sombreros'), 
  (SELECT id FROM brands WHERE name = 'Lagomarsino');

INSERT INTO products (name, description, price, category_id, brand_id)
SELECT 
  'Cuchillo Criollo 20cm', 
  'Hoja de acero al carbono, cabo de madera y alpaca.', 
  45000, 
  (SELECT id FROM categories WHERE slug = 'cuchilleria'), 
  (SELECT id FROM brands WHERE name = 'Muy Criollo');

-- Insert Images (Placeholders)
INSERT INTO product_images (product_id, url)
SELECT id, 'https://images.unsplash.com/photo-1575438464372-e4a806d28994?q=80&w=800&auto=format&fit=crop' FROM products WHERE name = 'Sombrero Lagomarsino Clasico';

