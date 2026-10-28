require('dotenv').config();
const { Pool } = require('pg');

// Connection string comes from backend/.env (never committed).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
