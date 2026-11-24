// Wholesale inquiry tests (SCRUM-91, SCRUM-92). Run with: npm test
// Needs a working MySQL database from backend/.env (run `npm run db:setup` first).
require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
delete process.env.RESEND_API_KEY; // never send real email from the tests

const { describe, test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const pool = require('../db/pool');
const app = require('../server');
const { signToken } = require('../middleware/auth');

const EMAIL_SUFFIX = '@wholesale-test.example.com';
const INBOX = `owner${EMAIL_SUFFIX}`;
const tokens = {};
const userIds = {};
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

/**
 * Sends the inquiry form and returns { status, body, emails, warnings }: what the mailer
 * printed (with no RESEND_API_KEY it prints instead of sending) and any console warnings.
 */
async function submit(body, token) {
  const printed = [];
  const warned = [];
  const realLog = console.log;
  const realWarn = console.warn;
  console.log = (...args) => printed.push(args.join(' '));
  console.warn = (...args) => warned.push(args.join(' '));
  try {
    const result = await call('POST', '/api/wholesale/inquiries', { token, body });
    return { ...result, emails: printed.join('\n'), warnings: warned.join('\n') };
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }
}

async function addUser(name, role) {
  const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
  const [result] = await pool.query('INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)', [
    `${name}${EMAIL_SUFFIX}`,
    'not-a-real-hash',
    roleRow.id,
  ]);
  userIds[name] = result.insertId;
  tokens[name] = signToken({ id: result.insertId });
}

async function savedInquiry(id) {
  const [[row]] = await pool.query('SELECT * FROM wholesale_inquiries WHERE id = ?', [id]);
  return row;
}

async function countInquiries() {
  const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM wholesale_inquiries WHERE email LIKE ?', [
    `%${EMAIL_SUFFIX}`,
  ]);
  return count;
}

async function cleanUp() {
  await pool.query('DELETE FROM wholesale_inquiries WHERE email LIKE ?', [`%${EMAIL_SUFFIX}`]);
  await pool.query('DELETE FROM users WHERE email LIKE ?', [`%${EMAIL_SUFFIX}`]);
}

const form = (overrides = {}) => ({
  businessName: 'Leaf & Bean Cafe',
  contactName: 'Sam Rivera',
  email: `sam${EMAIL_SUFFIX}`,
  message: 'We would like to stock your ceremonial matcha. What are your minimums?',
  ...overrides,
});

describe('wholesale inquiries (SCRUM-91, SCRUM-92)', () => {
  before(async () => {
    await cleanUp();
    await addUser('shopper', 'customer');
    await addUser('cafe', 'wholesale');
    await addUser('staffer', 'staff');
    await addUser('boss', 'admin');
    server = app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
  });

  beforeEach(() => {
    process.env.WHOLESALE_INBOX = INBOX;
  });

  after(async () => {
    await cleanUp();
    server.closeAllConnections();
    server.close();
    await pool.end();
  });

  test('a guest sends the form: it is saved and emailed to the owner', async () => {
    const { status, body, emails } = await submit(
      form({
        businessName: '  Leaf & Bean Cafe  ',
        email: `  SAM${EMAIL_SUFFIX.toUpperCase()}  `,
        phone: '555-0100',
        businessType: 'Cafe',
        website: 'https://leafandbean.example.com',
        expectedVolume: '5 kg a month',
      })
    );
    assert.strictEqual(status, 201);
    assert.match(body.message, /received your wholesale inquiry/);
    assert.strictEqual(body.inquiry.status, 'new');

    const row = await savedInquiry(body.inquiry.id);
    assert.strictEqual(row.business_name, 'Leaf & Bean Cafe', 'trimmed');
    assert.strictEqual(row.email, `sam${EMAIL_SUFFIX}`, 'trimmed and lowercased');
    assert.strictEqual(row.phone, '555-0100');
    assert.strictEqual(row.business_type, 'Cafe');
    assert.strictEqual(row.website, 'https://leafandbean.example.com');
    assert.strictEqual(row.expected_volume, '5 kg a month');
    assert.strictEqual(row.status, 'new');
    assert.strictEqual(row.user_id, null, 'guest inquiry has no account');

    assert.match(emails, new RegExp(`to:\\s+${INBOX}`), 'emailed to WHOLESALE_INBOX');
    assert.match(emails, /subject: New wholesale inquiry: Leaf & Bean Cafe/);
    assert.match(emails, /ceremonial matcha/);
    assert.match(emails, new RegExp(`inquiry #${body.inquiry.id}`));
    assert.ok(!emails.includes(`to:      sam${EMAIL_SUFFIX}`), 'nothing is emailed to the address in the form');
  });

  test('optional fields can be left out or blank', async () => {
    const { status, body } = await submit(form({ phone: '', website: '   ', businessType: null }));
    assert.strictEqual(status, 201);
    const row = await savedInquiry(body.inquiry.id);
    assert.strictEqual(row.phone, null);
    assert.strictEqual(row.website, null);
    assert.strictEqual(row.business_type, null);
    assert.strictEqual(row.expected_volume, null);
  });

  test('a signed-in sender is linked to their account; a bad token still counts as a guest', async () => {
    const signedIn = await submit(form(), tokens.shopper);
    assert.strictEqual(signedIn.status, 201);
    assert.strictEqual((await savedInquiry(signedIn.body.inquiry.id)).user_id, userIds.shopper);

    const badToken = await submit(form(), 'garbage');
    assert.strictEqual(badToken.status, 201);
    assert.strictEqual((await savedInquiry(badToken.body.inquiry.id)).user_id, null);
  });

  test('invalid forms get 400 and nothing is saved', async () => {
    const before = await countInquiries();
    const bad = [
      [form({ businessName: undefined }), /Business name is required/],
      [form({ contactName: '   ' }), /Contact name is required/],
      [form({ email: undefined }), /Email is required/],
      [form({ message: '' }), /Message is required/],
      [form({ email: 'not-an-email' }), /valid email/],
      [form({ website: 'javascript:alert(1)' }), /Website must be a link/],
      [form({ businessName: 'Leaf\r\nBcc: victim@example.com' }), /Business name must be on one line/],
      [form({ message: 'x'.repeat(5001) }), /Message must be 5000 characters or fewer/],
      [form({ phone: 5550100 }), /Phone must be text/],
      [form({ discount: '50%' }), /Unknown field: discount/],
      [['not', 'an', 'object'], /JSON object/],
    ];
    for (const [body, message] of bad) {
      const res = await submit(body);
      assert.strictEqual(res.status, 400, JSON.stringify(body).slice(0, 80));
      assert.match(res.body.error, message);
    }
    assert.strictEqual(await countInquiries(), before, 'no invalid inquiry was saved');
  });

  test('with no WHOLESALE_INBOX set, the inquiry is still saved, with a warning', async () => {
    delete process.env.WHOLESALE_INBOX;
    const { status, body, emails, warnings } = await submit(form());
    assert.strictEqual(status, 201);
    assert.ok(await savedInquiry(body.inquiry.id), 'saved');
    assert.strictEqual(emails, '', 'nothing emailed');
    assert.match(warnings, /WHOLESALE_INBOX is not set/);
  });

  test('if the email provider fails, the inquiry is still saved and the sender still gets 201', async () => {
    const realFetch = globalThis.fetch;
    const realError = console.error;
    const errors = [];
    process.env.RESEND_API_KEY = 'test-key';
    globalThis.fetch = (url, options) =>
      String(url).startsWith('https://api.resend.com')
        ? Promise.resolve(new Response('{}', { status: 500 }))
        : realFetch(url, options);
    console.error = (...args) => errors.push(args.join(' '));
    try {
      const { status, body } = await submit(form());
      assert.strictEqual(status, 201);
      assert.ok(await savedInquiry(body.inquiry.id), 'saved');
      assert.match(errors.join('\n'), /Could not email wholesale inquiry/);
    } finally {
      globalThis.fetch = realFetch;
      console.error = realError;
      delete process.env.RESEND_API_KEY;
    }
  });

  test('only admins and staff can list inquiries', async () => {
    assert.strictEqual((await call('GET', '/api/wholesale/inquiries')).status, 401);
    for (const who of ['shopper', 'cafe']) {
      assert.strictEqual((await call('GET', '/api/wholesale/inquiries', { token: tokens[who] })).status, 403, who);
    }
    for (const who of ['staffer', 'boss']) {
      const { status, body } = await call('GET', '/api/wholesale/inquiries', { token: tokens[who] });
      assert.strictEqual(status, 200, who);
      const mine = body.inquiries.filter((i) => i.email.endsWith(EMAIL_SUFFIX));
      assert.ok(mine.length >= 1, `${who} sees the test inquiries`);
      assert.ok('businessName' in mine[0] && 'message' in mine[0] && 'status' in mine[0]);
    }
  });

  test('the list is newest first and can be filtered by status', async () => {
    const first = (await submit(form({ businessName: 'Older Cafe' }))).body.inquiry.id;
    const second = (await submit(form({ businessName: 'Newer Cafe' }))).body.inquiry.id;

    const { body } = await call('GET', '/api/wholesale/inquiries', { token: tokens.boss });
    const ids = body.inquiries.map((i) => i.id);
    assert.ok(ids.indexOf(second) < ids.indexOf(first), 'newer inquiry comes first');

    await call('PATCH', `/api/wholesale/inquiries/${first}`, { token: tokens.boss, body: { status: 'closed' } });
    const closed = await call('GET', '/api/wholesale/inquiries?status=closed', { token: tokens.boss });
    assert.ok(closed.body.inquiries.every((i) => i.status === 'closed'));
    assert.ok(closed.body.inquiries.some((i) => i.id === first));

    assert.strictEqual((await call('GET', '/api/wholesale/inquiries?status=lost', { token: tokens.boss })).status, 400);
  });

  test('admins and staff can mark follow-up progress; others cannot', async () => {
    const id = (await submit(form())).body.inquiry.id;
    const path = `/api/wholesale/inquiries/${id}`;

    const updated = await call('PATCH', path, { token: tokens.staffer, body: { status: 'contacted' } });
    assert.strictEqual(updated.status, 200);
    assert.strictEqual(updated.body.inquiry.status, 'contacted');
    assert.strictEqual((await savedInquiry(id)).status, 'contacted');

    assert.strictEqual((await call('PATCH', path, { body: { status: 'closed' } })).status, 401);
    assert.strictEqual((await call('PATCH', path, { token: tokens.shopper, body: { status: 'closed' } })).status, 403);
    assert.strictEqual((await call('PATCH', path, { token: tokens.boss, body: { status: 'won' } })).status, 400);
    assert.strictEqual((await call('PATCH', path, { token: tokens.boss, body: {} })).status, 400);
    assert.strictEqual(
      (await call('PATCH', '/api/wholesale/inquiries/999999999', { token: tokens.boss, body: { status: 'closed' } })).status,
      404
    );
    assert.strictEqual((await call('PATCH', '/api/wholesale/inquiries/abc', { token: tokens.boss, body: { status: 'closed' } })).status, 400);
    assert.strictEqual((await savedInquiry(id)).status, 'contacted', 'rejected updates changed nothing');
  });
});
