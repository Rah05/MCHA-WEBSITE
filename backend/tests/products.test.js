// Public catalog and hidden wholesale pricing tests (SCRUM-89, SCRUM-92). Run with: npm test
// Needs a working MySQL database from backend/.env (run `npm run db:setup` first).
require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, test, before, after } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const app = require('../server');
const { signToken } = require('../middleware/auth');

const EMAIL_SUFFIX = '@catalog-test.example.com';
const PREFIX = 'catalog-test ';
const tokens = {};
const userIds = {};
const productIds = {};
let server;
let baseUrl;

/** GETs a path and returns { status, headers, body }. */
async function get(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(baseUrl + path, { headers });
  return { status: res.status, headers: res.headers, body: await res.json().catch(() => ({})) };
}

async function roleId(role) {
  const [[row]] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
  return row.id;
}

async function addUser(name, role) {
  const [result] = await pool.query('INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)', [
    `${name}${EMAIL_SUFFIX}`,
    'not-a-real-hash',
    await roleId(role),
  ]);
  userIds[name] = result.insertId;
  tokens[name] = signToken({ id: result.insertId });
}

async function addProduct(key, { wholesalePrice = null, isAvailable = true } = {}) {
  const [result] = await pool.query(
    'INSERT INTO products (name, category, price, wholesale_price, stock, is_available) VALUES (?, ?, ?, ?, ?, ?)',
    [`${PREFIX}${key}`, 'Matcha', 30, wholesalePrice, 10, isAvailable]
  );
  productIds[key] = result.insertId;
}

async function cleanUp() {
  await pool.query('DELETE FROM products WHERE name LIKE ?', [`${PREFIX}%`]);
  await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${EMAIL_SUFFIX}`]);
}

/** Our test products out of a catalog response, by key. */
function ours(products) {
  const byKey = {};
  for (const p of products) {
    if (p.name.startsWith(PREFIX)) byKey[p.name.slice(PREFIX.length)] = p;
  }
  return byKey;
}

describe('public catalog and hidden wholesale pricing (SCRUM-89, SCRUM-92)', () => {
  before(async () => {
    await cleanUp();
    await addUser('shopper', 'customer');
    await addUser('cafe', 'wholesale');
    await addUser('staffer', 'staff');
    await addUser('boss', 'admin');
    await addProduct('wholesale item', { wholesalePrice: 21 });
    await addProduct('retail only');
    await addProduct('hidden item', { wholesalePrice: 15, isAvailable: false });
    server = app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(async () => {
    await cleanUp();
    server.closeAllConnections();
    server.close();
    await pool.end();
  });

  test('guests see products for sale, but never a wholesale price', async () => {
    const { status, headers, body } = await get('/api/products');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.pricing, 'retail');
    assert.ok(!JSON.stringify(body).includes('wholesalePrice'), 'no wholesalePrice anywhere in the response');
    assert.match(headers.get('vary') || '', /Authorization/i);

    const mine = ours(body.products);
    assert.strictEqual(mine['wholesale item'].price, 30);
    assert.strictEqual(mine['wholesale item'].soldWholesale, true);
    assert.strictEqual(mine['retail only'].soldWholesale, false);
    assert.strictEqual(mine['hidden item'], undefined, 'hidden products are not listed');
  });

  test('signed-in customers do not see wholesale prices either', async () => {
    const { status, body } = await get('/api/products', tokens.shopper);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.pricing, 'retail');
    assert.ok(!JSON.stringify(body).includes('wholesalePrice'));
  });

  test('approved wholesale accounts, staff, and admins see wholesale prices', async () => {
    for (const who of ['cafe', 'staffer', 'boss']) {
      const { status, headers, body } = await get('/api/products', tokens[who]);
      assert.strictEqual(status, 200, who);
      assert.strictEqual(body.pricing, 'wholesale', who);
      assert.match(headers.get('cache-control') || '', /no-store/, `${who}: wholesale prices are never cached`);
      const mine = ours(body.products);
      assert.strictEqual(mine['wholesale item'].wholesalePrice, 21, who);
      assert.strictEqual(mine['retail only'].wholesalePrice, null, `${who}: null means not sold wholesale`);
      assert.strictEqual(mine['hidden item'], undefined, `${who}: hidden products stay hidden`);
    }
  });

  test('one product: same rules as the list', async () => {
    const path = `/api/products/${productIds['wholesale item']}`;

    const guest = await get(path);
    assert.strictEqual(guest.status, 200);
    assert.strictEqual(guest.body.pricing, 'retail');
    assert.strictEqual(guest.body.product.price, 30);
    assert.ok(!('wholesalePrice' in guest.body.product));

    const shopper = await get(path, tokens.shopper);
    assert.ok(!('wholesalePrice' in shopper.body.product));

    const cafe = await get(path, tokens.cafe);
    assert.strictEqual(cafe.body.pricing, 'wholesale');
    assert.strictEqual(cafe.body.product.wholesalePrice, 21);
  });

  test('hidden, missing, and malformed product ids', async () => {
    assert.strictEqual((await get(`/api/products/${productIds['hidden item']}`, tokens.boss)).status, 404);
    assert.strictEqual((await get('/api/products/999999999')).status, 404);
    assert.strictEqual((await get('/api/products/abc')).status, 400);
    assert.strictEqual((await get('/api/products/0')).status, 400);
  });

  test('a bad or expired token is treated as a guest, not turned away', async () => {
    const expired = jwt.sign({ sub: String(userIds.cafe), ver: 0, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
    const forged = jwt.sign({ sub: String(userIds.cafe), ver: 0 }, 'not-the-real-secret');
    for (const token of [expired, forged, 'garbage']) {
      const { status, body } = await get('/api/products', token);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.pricing, 'retail');
      assert.ok(!JSON.stringify(body).includes('wholesalePrice'));
    }
  });

  test('approving or removing a wholesale account takes effect immediately', async () => {
    const shopperToken = tokens.shopper;
    try {
      await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [await roleId('wholesale'), userIds.shopper]);
      const approved = await get('/api/products', shopperToken);
      assert.strictEqual(approved.body.pricing, 'wholesale', 'same token, now approved');

      await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [await roleId('customer'), userIds.shopper]);
      const removed = await get('/api/products', shopperToken);
      assert.strictEqual(removed.body.pricing, 'retail', 'same token, approval removed');
      assert.ok(!JSON.stringify(removed.body).includes('wholesalePrice'));
    } finally {
      await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [await roleId('customer'), userIds.shopper]);
    }
  });
});
