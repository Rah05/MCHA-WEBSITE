// Order history API tests (SCRUM-82, SCRUM-83). Run with: npm test
// Needs a working MySQL database from backend/.env (run `npm run db:setup` first).
require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, test, before, after } = require('node:test');
const assert = require('node:assert');
const pool = require('../db/pool');
const app = require('../server');
const { signToken } = require('../middleware/auth');

const EMAIL_SUFFIX = '@orders-test.example.com';
const PRODUCT_PREFIX = 'orders-test ';
const users = {}; // name -> { id, token }
const orderIds = {};
let server;
let baseUrl;

async function get(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(baseUrl + path, { headers });
  return { status: res.status, body: await res.json() };
}

async function addUser(name, role) {
  const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
  const [result] = await pool.query('INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)', [
    `${name}${EMAIL_SUFFIX}`,
    'not-a-real-hash',
    roleRow.id,
  ]);
  users[name] = { id: result.insertId, token: signToken({ id: result.insertId }) };
}

async function addOrder(userId, items, { status = 'paid', createdAt } = {}) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [order] = await pool.query(
    `INSERT INTO orders (user_id, customer_email, subtotal, total, status, created_at)
     VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
    [userId, `order${EMAIL_SUFFIX}`, total, total, status, createdAt || null]
  );
  for (const item of items) {
    await pool.query(
      'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)',
      [order.insertId, item.productId, item.name, item.price, item.quantity]
    );
  }
  return order.insertId;
}

async function cleanUp() {
  await pool.query('DELETE FROM orders WHERE customer_email = ?', [`order${EMAIL_SUFFIX}`]);
  await pool.query('DELETE FROM products WHERE name LIKE ?', [`${PRODUCT_PREFIX}%`]);
  await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${EMAIL_SUFFIX}`]);
}

describe('order history API (SCRUM-82)', () => {
  before(async () => {
    await cleanUp();
    await addUser('alice', 'customer');
    await addUser('bob', 'customer');
    await addUser('newbie', 'customer');
    await addUser('staffer', 'staff');
    await addUser('boss', 'admin');

    const [tea] = await pool.query(
      "INSERT INTO products (name, category, price, stock) VALUES (?, 'Matcha', 30, 10)",
      [`${PRODUCT_PREFIX}tea`]
    );
    const [whisk] = await pool.query(
      "INSERT INTO products (name, category, price, stock) VALUES (?, 'Teaware', 24, 10)",
      [`${PRODUCT_PREFIX}whisk`]
    );

    orderIds.aliceOld = await addOrder(
      users.alice.id,
      [{ productId: tea.insertId, name: 'M. Blend 30g', price: 30, quantity: 1 }],
      { status: 'fulfilled', createdAt: '2026-10-01 10:00:00' }
    );
    orderIds.aliceNew = await addOrder(users.alice.id, [
      { productId: tea.insertId, name: 'M. Blend 30g', price: 30, quantity: 2 },
      { productId: whisk.insertId, name: 'Bamboo chasen whisk', price: 24.5, quantity: 1 },
    ]);
    orderIds.bob = await addOrder(users.bob.id, [
      { productId: whisk.insertId, name: 'Bamboo chasen whisk', price: 24, quantity: 1 },
    ]);

    server = app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(async () => {
    await cleanUp();
    server.closeAllConnections();
    server.close();
    await pool.end();
  });

  test('signed-out visitors get 401', async () => {
    assert.strictEqual((await get('/api/orders')).status, 401);
    assert.strictEqual((await get(`/api/orders/${orderIds.aliceNew}`)).status, 401);
  });

  test('a customer with no orders gets an empty list (for the empty state)', async () => {
    const { status, body } = await get('/api/orders', users.newbie.token);
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(body.orders, []);
  });

  test('a customer sees only their own orders, newest first, with number, date, and status', async () => {
    const { status, body } = await get('/api/orders', users.alice.token);
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(
      body.orders.map((o) => o.orderNumber),
      [orderIds.aliceNew, orderIds.aliceOld]
    );
    const [newest] = body.orders;
    assert.strictEqual(newest.status, 'paid');
    assert.ok(!Number.isNaN(Date.parse(newest.createdAt)), 'createdAt is a date');
    assert.strictEqual(newest.total, 84.5);
    assert.strictEqual(newest.itemCount, 3);
    assert.ok(!body.orders.some((o) => o.orderNumber === orderIds.bob), "never includes someone else's order");
  });

  test('a customer can open their own order with its items', async () => {
    const { status, body } = await get(`/api/orders/${orderIds.aliceNew}`, users.alice.token);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.order.orderNumber, orderIds.aliceNew);
    assert.strictEqual(body.order.items.length, 2);
    const whisk = body.order.items.find((item) => item.name === 'Bamboo chasen whisk');
    assert.strictEqual(whisk.unitPrice, 24.5);
    assert.strictEqual(whisk.lineTotal, 24.5);
    assert.strictEqual(body.order.items.find((item) => item.name === 'M. Blend 30g').lineTotal, 60);
  });

  test("a customer gets 404 for someone else's order", async () => {
    const { status, body } = await get(`/api/orders/${orderIds.bob}`, users.alice.token);
    assert.strictEqual(status, 404);
    assert.strictEqual(body.error, 'Order not found');
  });

  test('admin and staff can open any order', async () => {
    assert.strictEqual((await get(`/api/orders/${orderIds.bob}`, users.boss.token)).status, 200);
    assert.strictEqual((await get(`/api/orders/${orderIds.bob}`, users.staffer.token)).status, 200);
  });

  test('a missing order is 404 and a bad order number is 400', async () => {
    assert.strictEqual((await get('/api/orders/999999999', users.boss.token)).status, 404);
    for (const bad of ['abc', '0', '-5', '1.5']) {
      assert.strictEqual((await get(`/api/orders/${bad}`, users.alice.token)).status, 400, bad);
    }
  });

  test('order items keep the price paid even if the product price changes later', async () => {
    await pool.query("UPDATE products SET price = 99 WHERE name = ?", [`${PRODUCT_PREFIX}tea`]);
    const { body } = await get(`/api/orders/${orderIds.aliceOld}`, users.alice.token);
    assert.strictEqual(body.order.items[0].unitPrice, 30);
  });
});
