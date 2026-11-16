-- Sample products for local development (from the admin products Figma mockup).
-- Run with: npm run db:seed   (safe to re-run; existing products are left alone)
INSERT IGNORE INTO products (name, category, price, wholesale_price, stock, stock_label, is_available) VALUES
  ('M. Blend 30g',               'Matcha',          30.00, 21.00, 42, NULL,            TRUE),
  ('Ceremonial Uji 20g',         'Matcha',          38.00, 27.50,  6, NULL,            TRUE),
  ('Hojicha 50g',                'Roasted tea',     18.00, 12.00, 31, NULL,            TRUE),
  ('Chawan bowl — Kyoto glaze',  'Teaware',         64.00, 44.00,  4, NULL,            TRUE),
  ('Bamboo chasen whisk',        'Teaware',         24.00, 15.00, 18, NULL,            TRUE),
  ('Iced Matcha Latte',          'Drinks (pop-up)',  7.00,  NULL,  0, 'Made to order', TRUE),
  ('Yuzu Matcha Soda',           'Drinks (pop-up)',  8.00,  NULL,  0, 'Seasonal',      FALSE);
