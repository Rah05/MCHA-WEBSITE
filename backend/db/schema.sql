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
