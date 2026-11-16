// Database rules for products, orders, and order items (SCRUM-120). Run with: npm test
// Needs a working MySQL database from backend/.env (run `npm run db:setup` first).
require('dotenv').config();

const { describe, test, before, after } = require('node:test');
const assert = require('node:assert');
const pool = require('../db/pool');

const PREFIX = 'schema-test ';
const EMAIL = 'schema-test@example.com';

async function cleanUp() {
  await pool.query('DELETE FROM orders WHERE customer_email = ?', [EMAIL]);
  await pool.query('DELETE FROM products WHERE name LIKE ?', [`${PREFIX}%`]);
  await pool.query('DELETE FROM users WHERE email = ?', [EMAIL]);
}

async function addProduct(name, fields = {}) {
  const [result] = await pool.query(
    'INSERT INTO products (name, category, price, wholesale_price, stock) VALUES (?, ?, ?, ?, ?)',
    [PREFIX + name, 'Matcha', fields.price ?? 30, fields.wholesale_price ?? null, fields.stock ?? 10]
  );
  return result.insertId;
}

async function addOrder(userId, items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [order] = await pool.query(
    'INSERT INTO orders (user_id, customer_email, subtotal, total) VALUES (?, ?, ?, ?)',
    [userId, EMAIL, subtotal, subtotal]
  );
  for (const item of items) {
    await pool.query(
      'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)',
      [order.insertId, item.productId, item.name, item.price, item.quantity]
    );
  }
  return order.insertId;
}

describe('products and orders schema', () => {
  before(cleanUp);
  after(async () => {
    await cleanUp();
    await pool.end();
  });

  test('prices come back as numbers, not strings', async () => {
    const id = await addProduct('price check', { price: 27.5, wholesale_price: 19.25 });
    const [[product]] = await pool.query('SELECT price, wholesale_price FROM products WHERE id = ?', [id]);
    assert.strictEqual(product.price, 27.5);
    assert.strictEqual(product.wholesale_price, 19.25);
  });

  test('negative prices and stock are rejected', async () => {
    await assert.rejects(addProduct('negative price', { price: -1 }), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
    await assert.rejects(addProduct('negative stock', { stock: -1 }), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
  });

  test('an order with items can be created and read back with its total', async () => {
    const tea = await addProduct('order tea', { price: 18 });
    const whisk = await addProduct('order whisk', { price: 24 });
    const orderId = await addOrder(null, [
      { productId: tea, name: 'Tea', price: 18, quantity: 2 },
      { productId: whisk, name: 'Whisk', price: 24, quantity: 1 },
    ]);
    const [[order]] = await pool.query('SELECT status, order_type, total FROM orders WHERE id = ?', [orderId]);
    const [items] = await pool.query('SELECT quantity FROM order_items WHERE order_id = ?', [orderId]);
    assert.strictEqual(order.status, 'pending');
    assert.strictEqual(order.order_type, 'retail');
    assert.strictEqual(order.total, 60);
    assert.strictEqual(items.length, 2);
  });

  test('order item quantity must be at least 1', async () => {
    const tea = await addProduct('zero qty');
    await assert.rejects(addOrder(null, [{ productId: tea, name: 'Tea', price: 30, quantity: 0 }]), {
      code: 'ER_CHECK_CONSTRAINT_VIOLATED',
    });
  });

  test('invalid order status is rejected', async () => {
    await assert.rejects(
      pool.query("INSERT INTO orders (customer_email, subtotal, total, status) VALUES (?, 0, 0, 'shipped')", [EMAIL])
    );
  });

  test('a product that has been ordered cannot be deleted', async () => {
    const tea = await addProduct('ordered once');
    await addOrder(null, [{ productId: tea, name: 'Tea', price: 30, quantity: 1 }]);
    await assert.rejects(pool.query('DELETE FROM products WHERE id = ?', [tea]), { code: 'ER_ROW_IS_REFERENCED_2' });
  });

  test('old orders keep the name and price they were bought at', async () => {
    const tea = await addProduct('renamed later', { price: 30 });
    const orderId = await addOrder(null, [{ productId: tea, name: 'Original name', price: 30, quantity: 1 }]);
    await pool.query('UPDATE products SET name = ?, price = 45 WHERE id = ?', [`${PREFIX}new name`, tea]);
    const [[item]] = await pool.query('SELECT product_name, unit_price FROM order_items WHERE order_id = ?', [orderId]);
    assert.strictEqual(item.product_name, 'Original name');
    assert.strictEqual(item.unit_price, 30);
  });

  test('deleting an order removes its items', async () => {
    const tea = await addProduct('cascade');
    const orderId = await addOrder(null, [{ productId: tea, name: 'Tea', price: 30, quantity: 1 }]);
    await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);
    const [items] = await pool.query('SELECT id FROM order_items WHERE order_id = ?', [orderId]);
    assert.strictEqual(items.length, 0);
  });

  test('deleting a user keeps their orders (as guest orders)', async () => {
    const [[customer]] = await pool.query("SELECT id FROM roles WHERE name = 'customer'");
    const [user] = await pool.query('INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)', [
      EMAIL,
      'x',
      customer.id,
    ]);
    const tea = await addProduct('user deleted');
    const orderId = await addOrder(user.insertId, [{ productId: tea, name: 'Tea', price: 30, quantity: 1 }]);
    await pool.query('DELETE FROM users WHERE id = ?', [user.insertId]);
    const [[order]] = await pool.query('SELECT user_id, customer_email FROM orders WHERE id = ?', [orderId]);
    assert.strictEqual(order.user_id, null);
    assert.strictEqual(order.customer_email, EMAIL);
  });

  test('the same Square payment cannot be recorded on two orders', async () => {
    const tea = await addProduct('square');
    const first = await addOrder(null, [{ productId: tea, name: 'Tea', price: 30, quantity: 1 }]);
    const second = await addOrder(null, [{ productId: tea, name: 'Tea', price: 30, quantity: 1 }]);
    await pool.query("UPDATE orders SET square_payment_id = 'sq_test_123' WHERE id = ?", [first]);
    await assert.rejects(pool.query("UPDATE orders SET square_payment_id = 'sq_test_123' WHERE id = ?", [second]), {
      code: 'ER_DUP_ENTRY',
    });
  });
});
