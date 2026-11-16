// Admin add/edit product API tests (SCRUM-63, SCRUM-64). Run with: npm test
// Needs a working MySQL database from backend/.env (run `npm run db:setup` first).
require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, test, before, after } = require('node:test');
const assert = require('node:assert');
const pool = require('../db/pool');
const app = require('../server');
const { signToken } = require('../middleware/auth');

const EMAIL_SUFFIX = '@admin-products-test.example.com';
const PREFIX = 'admin-products-test ';
const tokens = {};
let server;
let baseUrl;

async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(baseUrl + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function addUser(name, role) {
  const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
  const [result] = await pool.query('INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)', [
    `${name}${EMAIL_SUFFIX}`,
    'not-a-real-hash',
    roleRow.id,
  ]);
  tokens[name] = signToken({ id: result.insertId });
}

async function cleanUp() {
  await pool.query('DELETE FROM products WHERE name LIKE ?', [`${PREFIX}%`]);
  await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${EMAIL_SUFFIX}`]);
}

const newProduct = (overrides = {}) => ({
  name: `${PREFIX}Genmaicha 40g`,
  category: 'Roasted tea',
  price: 16.5,
  ...overrides,
});

describe('admin add and edit product API (SCRUM-63, SCRUM-64)', () => {
  before(async () => {
    await cleanUp();
    await addUser('boss', 'admin');
    await addUser('staffer', 'staff');
    await addUser('shopper', 'customer');
    server = app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(async () => {
    await cleanUp();
    server.closeAllConnections();
    server.close();
    await pool.end();
  });

  test('only admins can add, edit, or list products', async () => {
    assert.strictEqual((await call('POST', '/api/admin/products', { body: newProduct() })).status, 401);
    for (const who of ['staffer', 'shopper']) {
      const token = tokens[who];
      assert.strictEqual((await call('POST', '/api/admin/products', { token, body: newProduct() })).status, 403, who);
      assert.strictEqual((await call('PATCH', '/api/admin/products/1', { token, body: { price: 1 } })).status, 403, who);
      assert.strictEqual((await call('GET', '/api/admin/products', { token })).status, 403, who);
    }
    const [rows] = await pool.query('SELECT id FROM products WHERE name LIKE ?', [`${PREFIX}%`]);
    assert.strictEqual(rows.length, 0, 'nothing was created by non-admins');
  });

  test('admin adds a product with only the required fields and gets the defaults', async () => {
    const { status, body } = await call('POST', '/api/admin/products', { token: tokens.boss, body: newProduct() });
    assert.strictEqual(status, 201);
    const p = body.product;
    assert.ok(Number.isInteger(p.id));
    assert.strictEqual(p.name, `${PREFIX}Genmaicha 40g`);
    assert.strictEqual(p.category, 'Roasted tea');
    assert.strictEqual(p.price, 16.5);
    assert.strictEqual(p.stock, 0);
    assert.strictEqual(p.isAvailable, true);
    assert.strictEqual(p.wholesalePrice, null);
    assert.strictEqual(p.description, null);
    assert.strictEqual(p.imageUrl, null);
  });

  test('admin adds a product with every field', async () => {
    const full = newProduct({
      name: `  ${PREFIX}Gyokuro 20g  `,
      category: 'Matcha',
      description: 'Shade-grown green tea',
      price: 42,
      wholesalePrice: 29.4,
      stock: 12,
      stockLabel: '',
      imageUrl: 'https://example.com/gyokuro.jpg',
      isAvailable: false,
    });
    const { status, body } = await call('POST', '/api/admin/products', { token: tokens.boss, body: full });
    assert.strictEqual(status, 201);
    const p = body.product;
    assert.strictEqual(p.name, `${PREFIX}Gyokuro 20g`, 'name is trimmed');
    assert.strictEqual(p.description, 'Shade-grown green tea');
    assert.strictEqual(p.wholesalePrice, 29.4);
    assert.strictEqual(p.stock, 12);
    assert.strictEqual(p.stockLabel, null, 'a blank stock label is saved as null');
    assert.strictEqual(p.imageUrl, 'https://example.com/gyokuro.jpg');
    assert.strictEqual(p.isAvailable, false);
  });

  test('adding rejects missing, invalid, and unknown fields with 400', async () => {
    const bad = [
      [{ category: 'Matcha', price: 5 }, /name/],
      [newProduct({ price: undefined }), /price/],
      [newProduct({ name: '   ' }), /Name/],
      [newProduct({ price: -1 }), /Price/],
      [newProduct({ price: '16.50' }), /Price/],
      [newProduct({ price: 1.234 }), /Price/],
      [newProduct({ wholesalePrice: -2 }), /Wholesale/],
      [newProduct({ stock: 2.5 }), /Stock/],
      [newProduct({ imageUrl: 'javascript:alert(1)' }), /Image URL/],
      [newProduct({ isAvailable: 'yes' }), /isAvailable/],
      [newProduct({ retail: 30 }), /Unknown field: retail/],
    ];
    for (const [body, message] of bad) {
      const res = await call('POST', '/api/admin/products', { token: tokens.boss, body });
      assert.strictEqual(res.status, 400, JSON.stringify(body));
      assert.match(res.body.error, message);
    }
  });

  test('adding a product with a name that already exists is 409', async () => {
    const res = await call('POST', '/api/admin/products', { token: tokens.boss, body: newProduct({ price: 99 }) });
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.error, 'A product with this name already exists');
  });

  test('admin can load all products (including hidden) and one product for the edit form', async () => {
    const list = await call('GET', '/api/admin/products', { token: tokens.boss });
    assert.strictEqual(list.status, 200);
    const gyokuro = list.body.products.find((p) => p.name === `${PREFIX}Gyokuro 20g`);
    assert.ok(gyokuro, 'hidden products are included');
    assert.strictEqual(gyokuro.wholesalePrice, 29.4);

    const one = await call('GET', `/api/admin/products/${gyokuro.id}`, { token: tokens.boss });
    assert.strictEqual(one.status, 200);
    assert.strictEqual(one.body.product.name, `${PREFIX}Gyokuro 20g`);
  });

  test('admin edits a product and only the fields sent change', async () => {
    const [[row]] = await pool.query('SELECT id FROM products WHERE name = ?', [`${PREFIX}Genmaicha 40g`]);
    const { status, body } = await call('PATCH', `/api/admin/products/${row.id}`, {
      token: tokens.boss,
      body: { name: `${PREFIX}Genmaicha 50g`, price: 19, description: 'Toasted rice tea', wholesalePrice: 13 },
    });
    assert.strictEqual(status, 200);
    const p = body.product;
    assert.strictEqual(p.name, `${PREFIX}Genmaicha 50g`);
    assert.strictEqual(p.price, 19);
    assert.strictEqual(p.description, 'Toasted rice tea');
    assert.strictEqual(p.wholesalePrice, 13);
    assert.strictEqual(p.category, 'Roasted tea', 'unchanged');
    assert.strictEqual(p.isAvailable, true, 'unchanged');

    const cleared = await call('PATCH', `/api/admin/products/${row.id}`, {
      token: tokens.boss,
      body: { wholesalePrice: null, description: null },
    });
    assert.strictEqual(cleared.body.product.wholesalePrice, null, 'wholesale price can be removed');
    assert.strictEqual(cleared.body.product.description, null);
  });

  test('editing rejects bad input, an empty body, and a taken name', async () => {
    const [[row]] = await pool.query('SELECT id FROM products WHERE name = ?', [`${PREFIX}Genmaicha 50g`]);
    const path = `/api/admin/products/${row.id}`;
    const token = tokens.boss;

    assert.strictEqual((await call('PATCH', path, { token, body: {} })).status, 400);
    assert.strictEqual((await call('PATCH', path, { token, body: { price: -5 } })).status, 400);
    assert.strictEqual((await call('PATCH', path, { token, body: { name: '' } })).status, 400);
    assert.strictEqual((await call('PATCH', path, { token, body: { id: 5 } })).status, 400, 'id cannot be changed');
    const taken = await call('PATCH', path, { token, body: { name: `${PREFIX}Gyokuro 20g` } });
    assert.strictEqual(taken.status, 409);

    const [[after]] = await pool.query('SELECT name, price FROM products WHERE id = ?', [row.id]);
    assert.strictEqual(after.name, `${PREFIX}Genmaicha 50g`, 'failed edits change nothing');
    assert.strictEqual(after.price, 19);
  });

  test('a missing product is 404 and a bad id is 400', async () => {
    const token = tokens.boss;
    assert.strictEqual((await call('PATCH', '/api/admin/products/999999999', { token, body: { price: 1 } })).status, 404);
    assert.strictEqual((await call('GET', '/api/admin/products/999999999', { token })).status, 404);
    for (const bad of ['abc', '0', '-3']) {
      assert.strictEqual((await call('PATCH', `/api/admin/products/${bad}`, { token, body: { price: 1 } })).status, 400, bad);
      assert.strictEqual((await call('GET', `/api/admin/products/${bad}`, { token })).status, 400, bad);
    }
  });
});
