require('dotenv').config();
const mysql = require('mysql2/promise');

// Connection string comes from backend/.env (never committed).
// Format: mysql://user:password@host:3306/database
//
// Usage in routes/controllers (note the destructuring - mysql2 returns [rows, fields]):
//   const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
//   const [result] = await pool.query('INSERT INTO users (...) VALUES (?, ?)', [a, b]);
//   result.insertId  // id of the new row (MySQL has no RETURNING)
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  // Store and return DATETIME values as UTC
  timezone: 'Z',
  // Return DECIMAL columns (prices) as numbers instead of strings like "30.00"
  decimalNumbers: true,
});

// Make NOW()/CURRENT_TIMESTAMP use UTC too, so timestamps match on every machine
pool.pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

module.exports = pool;
