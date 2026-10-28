const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/health -> confirms the API is up and reports database status
router.get('/', async (req, res) => {
  let database = 'not configured';
  if (process.env.DATABASE_URL) {
    try {
      await pool.query('SELECT 1');
      database = 'connected';
    } catch (err) {
      database = 'unreachable';
    }
  }
  res.json({ status: 'ok', app: 'M.CHA API', database });
});

module.exports = router;
