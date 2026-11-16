// Role-based access control tests (SCRUM-55). Run with: npm test
// Needs a working MySQL database from backend/.env (run `npm run db:setup` first).
require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, test, before, after } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const app = require('../server');
const {
  ROLES,
  signToken,
  requireAuth,
  optionalAuth,
  requireRole,
  requireSelfOrRole,
} = require('../middleware/auth');

const EMAIL_SUFFIX = '@rbac-test.example.com';
const users = {}; // role -> { id, token }
let server;
let baseUrl;

// Small app with one route per rule, so each rule can be tested on its own
const testApp = express();
testApp.get('/guest-ok', optionalAuth, (req, res) => res.json({ role: req.user ? req.user.role : 'guest' }));
testApp.get('/signed-in', requireAuth, (req, res) => res.json({ ok: true }));
testApp.get('/admin', requireAuth, requireRole(ROLES.ADMIN), (req, res) => res.json({ ok: true }));
testApp.get('/staff-area', requireAuth, requireRole(ROLES.ADMIN, ROLES.STAFF), (req, res) => res.json({ ok: true }));
testApp.get('/users/:userId', requireAuth, requireSelfOrRole('userId', ROLES.ADMIN), (req, res) => res.json({ ok: true }));
testApp.use('/', app);

async function call(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(baseUrl + path, { headers });
  return res.status;
}

describe('role-based access control', () => {
  before(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${EMAIL_SUFFIX}`]);
    for (const role of Object.values(ROLES)) {
      const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
      const [result] = await pool.query(
        'INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)',
        [`${role}${EMAIL_SUFFIX}`, 'not-a-real-hash', roleRow.id]
      );
      users[role] = { id: result.insertId, token: signToken({ id: result.insertId }) };
    }
    server = testApp.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${EMAIL_SUFFIX}`]);
    server.closeAllConnections(); // fetch keeps connections open, which would stop the test run from exiting
    server.close();
    await pool.end();
  });

  test('guests can use public routes', async () => {
    assert.strictEqual(await call('/guest-ok'), 200);
  });

  test('guests are blocked from signed-in routes (401)', async () => {
    assert.strictEqual(await call('/signed-in'), 401);
    assert.strictEqual(await call('/admin'), 401);
    assert.strictEqual(await call('/api/users/me'), 401);
  });

  test('admin-only routes allow admins and block everyone else', async () => {
    assert.strictEqual(await call('/admin', users.admin.token), 200);
    assert.strictEqual(await call('/admin', users.staff.token), 403);
    assert.strictEqual(await call('/admin', users.customer.token), 403);
  });

  test('staff routes allow admin and staff, block customers', async () => {
    assert.strictEqual(await call('/staff-area', users.admin.token), 200);
    assert.strictEqual(await call('/staff-area', users.staff.token), 200);
    assert.strictEqual(await call('/staff-area', users.customer.token), 403);
  });

  test('customers can only reach their own records; admins can reach anyone', async () => {
    const own = users.customer.id;
    const other = users.staff.id;
    assert.strictEqual(await call(`/users/${own}`, users.customer.token), 200);
    assert.strictEqual(await call(`/users/${other}`, users.customer.token), 403);
    assert.strictEqual(await call(`/users/${own}`, users.admin.token), 200);
  });

  test('GET /api/users/me returns the signed-in user and role', async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${users.staff.token}` },
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.user.role, 'staff');
    assert.strictEqual(body.user.id, users.staff.id);
    assert.strictEqual(body.user.password_hash, undefined, 'must never send the password hash');
  });

  test('tampered, wrong-secret, expired, and malformed tokens are rejected (401)', async () => {
    const tampered = users.customer.token.slice(0, -2) + 'xx';
    const wrongSecret = jwt.sign({ sub: String(users.admin.id) }, 'not-our-secret');
    const expired = jwt.sign({ sub: String(users.admin.id) }, process.env.JWT_SECRET, { expiresIn: -10 });
    const noneAlg = jwt.sign({ sub: String(users.admin.id) }, '', { algorithm: 'none' });
    for (const token of [tampered, wrongSecret, expired, noneAlg, 'garbage']) {
      assert.strictEqual(await call('/signed-in', token), 401);
    }
  });

  test('a role change takes effect immediately, without a new token', async () => {
    const { id, token } = users.customer;
    assert.strictEqual(await call('/admin', token), 403);
    const [[adminRole]] = await pool.query('SELECT id FROM roles WHERE name = ?', [ROLES.ADMIN]);
    await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [adminRole.id, id]);
    assert.strictEqual(await call('/admin', token), 200);
  });

  test('a deleted user’s token stops working', async () => {
    const { id, token } = users.staff;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    assert.strictEqual(await call('/signed-in', token), 401);
  });
});
