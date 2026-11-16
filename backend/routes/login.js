// Sign-in route (SCRUM-98). Mounted at /api/auth in server.js, so this file serves POST /api/auth/login.
const express = require('express');
const { login } = require('../controllers/loginController');

const router = express.Router();

router.post('/login', login);

module.exports = router;
