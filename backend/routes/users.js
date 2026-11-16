const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me -> the signed-in user and their role (for showing/hiding pages in the frontend)
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
