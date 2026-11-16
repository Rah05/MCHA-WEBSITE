// Admin product routes (SCRUM-65). Mounted at /api/admin/products in server.js.
const express = require('express');
const { requireAuth, requireRole, ROLES } = require('../middleware/auth');
const { deleteProduct } = require('../controllers/productController');

const router = express.Router();

router.delete('/:id', requireAuth, requireRole(ROLES.ADMIN), deleteProduct); // DELETE /api/admin/products/:id

module.exports = router;
