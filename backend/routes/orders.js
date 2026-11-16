// Order history routes (SCRUM-82, SCRUM-83). Mounted at /api/orders in server.js.
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { listMyOrders, getOrder } = require('../controllers/orderController');

const router = express.Router();

router.get('/', requireAuth, listMyOrders); // GET /api/orders
router.get('/:orderId', requireAuth, getOrder); // GET /api/orders/:orderId

module.exports = router;
