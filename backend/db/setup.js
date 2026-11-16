// Creates the database (if missing) and applies db/schema.sql.
// Usage: npm run db:setup          (reads DATABASE_URL from backend/.env)
//        npm run db:seed           (also adds sample products from db/seed.sql)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// schema.sql uses CREATE TABLE IF NOT EXISTS, so a column added to a table later never
// reaches a database that already has that table. Each entry here adds one such column
// when it's missing, so `npm run db:setup` brings an existing database up to date
// without deleting anything. MySQL 8 has no ADD COLUMN IF NOT EXISTS, hence the check.
const COLUMN_UPDATES = [
  // SCRUM-101: lets a password reset sign the user out on every device.
  { table: 'users', column: 'token_version', definition: 'INT NOT NULL DEFAULT 0 AFTER reset_token_expires' },
];

async function applyColumnUpdates(db) {
  for (const { table, column, definition } of COLUMN_UPDATES) {
    const [rows] = await db.query(
      'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [table, column]
    );
    if (rows.length === 0) {
      await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`Added column ${table}.${column}.`);
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  const url = new URL(process.env.DATABASE_URL);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!database) {
    console.error('DATABASE_URL must end with a database name, e.g. mysql://root:pass@localhost:3306/mcha');
    process.exit(1);
  }

  const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

  // Connect without a database first so we can create it
  url.pathname = '/';
  const server = await mysql.createConnection({ uri: url.toString(), ssl });
  await server.query(
    `CREATE DATABASE IF NOT EXISTS \`${database.replace(/`/g, '``')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await server.end();

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const db = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl,
    multipleStatements: true,
  });
  await db.query(schema);
  await applyColumnUpdates(db);
  if (process.argv.includes('--seed')) {
    await db.query(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));
    const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM products');
    console.log(`Sample data loaded (${count} products).`);
  }
  const [tables] = await db.query('SHOW TABLES');
  await db.end();

  console.log(`Database "${database}" is ready. Tables: ${tables.map((t) => Object.values(t)[0]).join(', ')}`);
}

main().catch((err) => {
  console.error('Database setup failed:', err.code || '', err.message);
  process.exit(1);
});
