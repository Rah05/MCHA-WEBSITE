// Admin product routes (SCRUM-65, SCRUM-66). Mounted at /api/admin/products in server.js.
const express = require('express');
const { requireAuth, requireRole, ROLES } = require('../middleware/auth');
const { deleteProduct, updatePriceAvailability } = require('../controllers/productController');

const router = express.Router();

router.delete('/:id', requireAuth, requireRole(ROLES.ADMIN), deleteProduct); // DELETE /api/admin/products/:id
router.patch('/:id/price-availability', requireAuth, requireRole(ROLES.ADMIN), updatePriceAvailability); // PATCH /api/admin/products/:id/price-availability

module.exports = router;
