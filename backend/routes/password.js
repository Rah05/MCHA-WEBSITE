/**
 * Password reset routes (SCRUM-100).
 *
 * Mounted at /api/auth in server.js, so this file serves:
 *   POST /api/auth/forgot-password
 *   POST /api/auth/reset-password
 *
 * No auth middleware on either, and that is the point rather than an oversight: a
 * user who has forgotten their password has no token to send. The token in the
 * emailed link is what stands in for proof of identity, and the controller is where
 * it gets checked.
 *
 * These live apart from routes/login.js because they are a different concern, but
 * note that server.js now mounts three separate routers at /api/auth. Express handles
 * that correctly, though folding auth.js, login.js, and this file into one router is
 * worth doing once the open auth PRs have landed and the merge conflicts are gone.
 */
 const express = require('express');
 const { forgotPassword, resetPassword } = require('../controllers/passwordResetController');
 
 const router = express.Router();
 
 router.post('/forgot-password', forgotPassword);
 router.post('/reset-password', resetPassword);
 
 module.exports = router;