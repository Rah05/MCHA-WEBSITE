// Admin product routes (SCRUM-63, SCRUM-64, SCRUM-65, SCRUM-66). Mounted at /api/admin/products in server.js.
// Every route is admin only.
const express = require('express');
const { requireAuth, requireRole, ROLES } = require('../middleware/auth');
const {
  deleteProduct,
  updatePriceAvailability,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
} = require('../controllers/productController');

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/', listProducts); // GET /api/admin/products
router.post('/', createProduct); // POST /api/admin/products (SCRUM-63)
router.get('/:id', getProduct); // GET /api/admin/products/:id
router.patch('/:id', updateProduct); // PATCH /api/admin/products/:id (SCRUM-64)
router.delete('/:id', deleteProduct); // DELETE /api/admin/products/:id (SCRUM-65)
router.patch('/:id/price-availability', updatePriceAvailability); // PATCH /api/admin/products/:id/price-availability (SCRUM-66)

module.exports = router;
