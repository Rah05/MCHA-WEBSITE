// Sign-in endpoint tests (SCRUM-98). Run with: npm test
// Needs a working MySQL database from backend/.env (run `npm run db:setup` first).
require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, test, before, after } = require('node:test');
const assert = require('node:assert');
const pool = require('../db/pool');
const app = require('../server');
const { hashPassword } = require('../utils/password');

const EMAIL_SUFFIX = '@login-test.example.com';
const EMAIL = `customer${EMAIL_SUFFIX}`;
const PASSWORD = 'Matcha-Latte-2026';

let server;
let baseUrl;

/** POSTs to /api/auth/login and returns { status, body }. */
async function login(payload) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

describe('POST /api/auth/login (SCRUM-98)', () => {
  before(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${EMAIL_SUFFIX}`]);
    const [[role]] = await pool.query("SELECT id FROM roles WHERE name = 'customer'");
    await pool.query(
      'INSERT INTO users (email, password_hash, role_id, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
      [EMAIL, await hashPassword(PASSWORD), role.id, 'Test', 'Customer']
    );

    server = app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${EMAIL_SUFFIX}`]);
    server.closeAllConnections(); // fetch keeps connections open, which would stop the test run from exiting
    server.close();
    await pool.end();
  });

  test('correct credentials return a token and the user, never the password hash', async () => {
    const { status, body } = await login({ email: EMAIL, password: PASSWORD });

    assert.strictEqual(status, 200);
    assert.ok(body.token, 'should return a token');
    assert.strictEqual(body.user.email, EMAIL);
    assert.strictEqual(body.user.role, 'customer');
    assert.strictEqual(body.user.password_hash, undefined, 'must never send the hash to the client');
    assert.ok(!JSON.stringify(body).includes(PASSWORD), 'must never echo the password back');
  });

  test('the token works on a protected route', async () => {
    const { body } = await login({ email: EMAIL, password: PASSWORD });

    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${body.token}` },
    });
    assert.strictEqual(res.status, 200);
    const me = await res.json();
    assert.strictEqual(me.user.email, EMAIL);
  });

  test('the email is not case sensitive and spaces are ignored', async () => {
    const { status } = await login({ email: `  ${EMAIL.toUpperCase()}  `, password: PASSWORD });
    assert.strictEqual(status, 200);
  });

  test('a wrong password is rejected with 401', async () => {
    const { status, body } = await login({ email: EMAIL, password: 'wrong-password' });

    assert.strictEqual(status, 401);
    assert.strictEqual(body.token, undefined);
  });

  test('the password is case sensitive', async () => {
    const { status } = await login({ email: EMAIL, password: PASSWORD.toLowerCase() });
    assert.strictEqual(status, 401);
  });

  test('an unknown email gives the same 401 message as a wrong password', async () => {
    const unknown = await login({ email: `nobody${EMAIL_SUFFIX}`, password: PASSWORD });
    const wrongPassword = await login({ email: EMAIL, password: 'wrong-password' });

    assert.strictEqual(unknown.status, 401);
    // Identical responses, so an attacker can't use the error to discover which emails have accounts.
    assert.deepStrictEqual(unknown.body, wrongPassword.body);
  });

  test('missing or non-string fields are rejected with 400', async () => {
    assert.strictEqual((await login({ email: EMAIL })).status, 400);
    assert.strictEqual((await login({ password: PASSWORD })).status, 400);
    assert.strictEqual((await login({})).status, 400);
    assert.strictEqual((await login({ email: EMAIL, password: { $ne: null } })).status, 400);
  });

  test('the stored password is a bcrypt hash, not the plaintext', async () => {
    const [[row]] = await pool.query('SELECT password_hash FROM users WHERE email = ?', [EMAIL]);

    assert.notStrictEqual(row.password_hash, PASSWORD);
    assert.match(row.password_hash, /^\$2[aby]\$\d{2}\$/);
  });
});
