// Forgot / reset password tests (SCRUM-100, SCRUM-101, SCRUM-102). Run with: npm test
// Needs a working MySQL database from backend/.env (run `npm run db:setup` first).
require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
delete process.env.RESEND_API_KEY; // never send real email from the tests

const { describe, test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const pool = require('../db/pool');
const app = require('../server');
const { hashPassword } = require('../utils/password');
const { createResetToken, hashResetToken } = require('../utils/resetToken');

const EMAIL_SUFFIX = '@reset-test.example.com';
const EMAIL = `customer${EMAIL_SUFFIX}`;
const OLD_PASSWORD = 'Old-Matcha-2026';
const NEW_PASSWORD = 'New-Matcha-2026';
const LINK_INVALID = 'This reset link has expired or has already been used';

let server;
let baseUrl;
let userId;

/** POSTs JSON to the API and returns { status, body }. */
async function post(path, payload) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

/** Signs in and returns the login token, or null if the sign-in failed. */
async function loginToken(password) {
  const { status, body } = await post('/api/auth/login', { email: EMAIL, password });
  return status === 200 ? body.token : null;
}

/** Status of GET /api/users/me with this token: 200 signed in, 401 signed out. */
async function meStatus(token) {
  const res = await fetch(`${baseUrl}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  return res.status;
}

/** Gives the test user a fresh reset link and returns its raw token. */
async function issueResetToken({ expired = false } = {}) {
  const { token, tokenHash, expiresAt } = createResetToken();
  await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [
    tokenHash,
    expired ? new Date(Date.now() - 60 * 1000) : expiresAt,
    userId,
  ]);
  return token;
}

/**
 * Calls forgot-password and returns { status, body, emails }, where emails is what the
 * mailer printed. With no RESEND_API_KEY the mailer prints instead of sending, so this
 * is how a test reads the link a user would have received.
 */
async function forgotPassword(email) {
  const printed = [];
  const realLog = console.log;
  console.log = (...args) => printed.push(args.join(' '));
  try {
    const result = await post('/api/auth/forgot-password', { email });
    return { ...result, emails: printed.join('\n') };
  } finally {
    console.log = realLog;
  }
}

describe('forgot / reset password (SCRUM-102)', () => {
  before(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${EMAIL_SUFFIX}`]);
    const [[role]] = await pool.query("SELECT id FROM roles WHERE name = 'customer'");
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, role_id, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
      [EMAIL, await hashPassword(OLD_PASSWORD), role.id, 'Test', 'Customer']
    );
    userId = result.insertId;

    server = app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
  });

  // Every test starts from the same place: old password, no reset link pending.
  beforeEach(async () => {
    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [await hashPassword(OLD_PASSWORD), userId]
    );
  });

  after(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${EMAIL_SUFFIX}`]);
    server.closeAllConnections(); // fetch keeps connections open, which would stop the test run from exiting
    server.close();
    await pool.end();
  });

  test('forgot-password gives the same reply for a registered and an unknown email', async () => {
    const known = await forgotPassword(EMAIL);
    const unknown = await forgotPassword(`nobody${EMAIL_SUFFIX}`);

    assert.strictEqual(known.status, 200);
    assert.strictEqual(unknown.status, 200);
    // Identical replies, so the endpoint can't be used to find out who has an account.
    assert.deepStrictEqual(known.body, unknown.body);
    assert.ok(known.emails.includes('/reset-password?token='), 'a registered email gets a link');
    assert.ok(!unknown.emails.includes('/reset-password?token='), 'an unknown email gets nothing');
  });

  test('the emailed link resets the password, and only its hash is stored', async () => {
    const { emails } = await forgotPassword(`  ${EMAIL.toUpperCase()}  `);
    const token = emails.match(/reset-password\?token=([0-9a-f]+)/)[1];

    const [[row]] = await pool.query('SELECT reset_token FROM users WHERE id = ?', [userId]);
    assert.notStrictEqual(row.reset_token, token, 'the raw token must never be stored');
    assert.strictEqual(row.reset_token, hashResetToken(token));

    const { status } = await post('/api/auth/reset-password', { token, password: NEW_PASSWORD });
    assert.strictEqual(status, 200);
    assert.strictEqual(await loginToken(OLD_PASSWORD), null, 'the old password stops working');
    assert.ok(await loginToken(NEW_PASSWORD), 'the new password works');
  });

  test('an expired reset link is rejected and the password is unchanged', async () => {
    const token = await issueResetToken({ expired: true });

    const { status, body } = await post('/api/auth/reset-password', { token, password: NEW_PASSWORD });
    assert.strictEqual(status, 400);
    assert.strictEqual(body.error, LINK_INVALID);
    assert.ok(await loginToken(OLD_PASSWORD), 'the old password still works');
  });

  test('a reset link works only once', async () => {
    const token = await issueResetToken();

    assert.strictEqual((await post('/api/auth/reset-password', { token, password: NEW_PASSWORD })).status, 200);
    const reused = await post('/api/auth/reset-password', { token, password: 'Third-Matcha-2026' });
    assert.strictEqual(reused.status, 400);
    assert.strictEqual(reused.body.error, LINK_INVALID);
    assert.ok(await loginToken(NEW_PASSWORD), 'the first reset stands');
  });

  test('requesting a second link cancels the first', async () => {
    const first = await issueResetToken();
    await forgotPassword(EMAIL);

    const { status } = await post('/api/auth/reset-password', { token: first, password: NEW_PASSWORD });
    assert.strictEqual(status, 400);
  });

  test('a made-up token gets the same reply as an expired one', async () => {
    const { status, body } = await post('/api/auth/reset-password', { token: 'a'.repeat(64), password: NEW_PASSWORD });

    assert.strictEqual(status, 400);
    // Same message, so guessing tokens can't tell you whether one was ever real.
    assert.strictEqual(body.error, LINK_INVALID);
  });

  test('a password under 8 characters is rejected and does not use up the link', async () => {
    const token = await issueResetToken();

    const short = await post('/api/auth/reset-password', { token, password: 'short' });
    assert.strictEqual(short.status, 400);
    assert.match(short.body.error, /at least 8 characters/);

    // The user can fix the password and try again with the same link.
    assert.strictEqual((await post('/api/auth/reset-password', { token, password: NEW_PASSWORD })).status, 200);
  });

  test('missing or non-string fields are rejected with 400', async () => {
    assert.strictEqual((await post('/api/auth/forgot-password', {})).status, 400);
    assert.strictEqual((await post('/api/auth/forgot-password', { email: { $ne: null } })).status, 400);
    assert.strictEqual((await post('/api/auth/reset-password', { password: NEW_PASSWORD })).status, 400);
    assert.strictEqual((await post('/api/auth/reset-password', { token: 'abc' })).status, 400);
    assert.strictEqual((await post('/api/auth/reset-password', { token: ['abc'], password: NEW_PASSWORD })).status, 400);
  });

  test('a password reset signs the user out on every device (SCRUM-101)', async () => {
    const laptop = await loginToken(OLD_PASSWORD);
    const phone = await loginToken(OLD_PASSWORD);
    assert.strictEqual(await meStatus(laptop), 200);
    assert.strictEqual(await meStatus(phone), 200);

    const token = await issueResetToken();
    assert.strictEqual((await post('/api/auth/reset-password', { token, password: NEW_PASSWORD })).status, 200);

    assert.strictEqual(await meStatus(laptop), 401, 'tokens from before the reset stop working');
    assert.strictEqual(await meStatus(phone), 401);
    assert.strictEqual(await meStatus(await loginToken(NEW_PASSWORD)), 200, 'signing in again works');
  });
});
