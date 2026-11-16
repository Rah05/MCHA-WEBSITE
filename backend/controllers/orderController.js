/**
 * Order history controller (SCRUM-82, SCRUM-83).
 *
 * Customers can list and open only their own orders. Admin and staff can open any order,
 * so the admin tools can look one up. Both routes require a signed-in user (`requireAuth`).
 */
const pool = require('../db/pool');
const { ROLES } = require('../middleware/auth');

// Roles allowed to open orders that belong to someone else.
const CAN_VIEW_ANY_ORDER = [ROLES.ADMIN, ROLES.STAFF];

// Same response whether the order doesn't exist or belongs to another customer,
// so customers can't find out which order numbers exist by guessing.
const ORDER_NOT_FOUND = { error: 'Order not found' };

/** Shapes an `orders` row for the frontend (camelCase, no internal fields). */
function toOrderSummary(row) {
  return {
    id: row.id,
    orderNumber: row.id,
    createdAt: row.created_at,
    status: row.status,
    orderType: row.order_type,
    total: row.total,
    itemCount: Number(row.item_count),
  };
}

/**
 * GET /api/orders
 * The signed-in user's orders, newest first.
 *
 * @returns 200 { orders: [...] }. `orders` is an empty array when there are none.
 */
async function listMyOrders(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT orders.id, orders.created_at, orders.status, orders.order_type, orders.total,
              COALESCE(SUM(order_items.quantity), 0) AS item_count
       FROM orders
       LEFT JOIN order_items ON order_items.order_id = orders.id
       WHERE orders.user_id = ?
       GROUP BY orders.id
       ORDER BY orders.created_at DESC, orders.id DESC`,
      [req.user.id]
    );
    res.json({ orders: rows.map(toOrderSummary) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:orderId
 * One order with its items. Customers get 404 for orders that aren't theirs.
 *
 * @returns 200 { order: { ...summary, subtotal, customerName, customerEmail, notes, items: [...] } }
 *          400 if orderId isn't a positive whole number.
 *          404 if the order doesn't exist or the user isn't allowed to see it.
 */
async function getOrder(req, res, next) {
  const orderId = Number(req.params.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'Invalid order number' });
  }

  try {
    const [orders] = await pool.query(
      `SELECT id, user_id, created_at, updated_at, status, order_type, subtotal, total,
              customer_name, customer_email, notes
       FROM orders WHERE id = ?`,
      [orderId]
    );
    const order = orders[0];

    const isOwner = order && order.user_id === req.user.id;
    if (!order || (!isOwner && !CAN_VIEW_ANY_ORDER.includes(req.user.role))) {
      return res.status(404).json(ORDER_NOT_FOUND);
    }

    // Name and price come from order_items (copied at checkout), not the current product,
    // so the order shows what the customer actually paid.
    const [items] = await pool.query(
      `SELECT id, product_id, product_name, unit_price, quantity
       FROM order_items WHERE order_id = ? ORDER BY id`,
      [orderId]
    );

    res.json({
      order: {
        ...toOrderSummary({ ...order, item_count: items.reduce((sum, item) => sum + item.quantity, 0) }),
        updatedAt: order.updated_at,
        subtotal: order.subtotal,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        notes: order.notes,
        items: items.map((item) => ({
          id: item.id,
          productId: item.product_id,
          name: item.product_name,
          unitPrice: item.unit_price,
          quantity: item.quantity,
          lineTotal: Math.round(item.unit_price * item.quantity * 100) / 100,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMyOrders, getOrder };
