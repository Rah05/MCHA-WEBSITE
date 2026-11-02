-- M.CHA database schema (MySQL 8+). Harpreet owns this file; add tables as stories need them.
-- Run with: npm run db:setup   (from backend/, reads DATABASE_URL from .env)
-- Safe to re-run: tables use IF NOT EXISTS and seed rows use INSERT IGNORE.

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE  -- 'admin', 'staff', 'customer'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO roles (name) VALUES ('admin'), ('staff'), ('customer');

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  reset_token VARCHAR(255),
  reset_token_expires DATETIME,          -- stored in UTC
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products: matcha, roasted tea, teaware, and pop-up drinks (SCRUM-17, SCRUM-18).
-- Fields match the admin products page. Prices are in dollars.
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL,          -- 'Matcha', 'Roasted tea', 'Teaware', 'Drinks (pop-up)'
  price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2),          -- NULL = not sold wholesale. Never show this to customers
  stock INT NOT NULL DEFAULT 0,
  stock_label VARCHAR(50),                -- shown instead of a count, e.g. 'Made to order', 'Seasonal'
  image_url VARCHAR(500),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE hides it from the shop without deleting it
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_products_price CHECK (price >= 0),
  CONSTRAINT chk_products_wholesale CHECK (wholesale_price IS NULL OR wholesale_price >= 0),
  CONSTRAINT chk_products_stock CHECK (stock >= 0),
  INDEX idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders: one row per checkout. user_id is NULL for guest checkout.
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  customer_email VARCHAR(255) NOT NULL,   -- copied at checkout so guest orders have a contact
  customer_name VARCHAR(200),
  order_type ENUM('retail', 'wholesale') NOT NULL DEFAULT 'retail',
  status ENUM('pending', 'paid', 'fulfilled', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  square_payment_id VARCHAR(100) UNIQUE,  -- set once Square confirms payment
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_orders_amounts CHECK (subtotal >= 0 AND total >= 0),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items: the products in each order. Name and price are copied at checkout,
-- so old orders stay correct if a product is renamed or repriced later.
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  -- A product that has been ordered can't be deleted; set is_available = FALSE instead
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT chk_order_items_price CHECK (unit_price >= 0),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
