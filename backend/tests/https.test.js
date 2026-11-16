// HTTPS enforcement and security header tests (SCRUM-53, SCRUM-56). Run with: npm test
//
// These tests need no database. They run against the real app from server.js, using
// routes that never touch MySQL, so a failure here is always about the middleware.
//
// Note on the other two parts of SCRUM-56:
//   - secure password storage is covered by tests/password.test.js and tests/login.test.js
//   - role-based access restrictions are covered by tests/auth.test.js
require('dotenv').config();

const { describe, test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const app = require('../server');

let server;
let baseUrl;
let originalForceHttps;

/**
 * Sends a request without following redirects, so the 301 itself can be inspected.
 * @param {string} path
 * @param {{ proto?: string, method?: string }} options `proto` sets x-forwarded-proto.
 */
async function request(path, { proto, method = 'GET' } = {}) {
  return fetch(baseUrl + path, {
    method,
    redirect: 'manual',
    headers: proto ? { 'x-forwarded-proto': proto } : {},
  });
}

describe('HTTPS enforcement and security headers (SCRUM-53)', () => {
  before(() => {
    originalForceHttps = process.env.FORCE_HTTPS;
    server = app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(() => {
    // Restore the environment so later test files see what they expect
    if (originalForceHttps === undefined) delete process.env.FORCE_HTTPS;
    else process.env.FORCE_HTTPS = originalForceHttps;

    server.closeAllConnections(); // fetch keeps connections open, which would stop the test run from exiting
    server.close();
  });

  beforeEach(() => {
    process.env.FORCE_HTTPS = 'true';
  });

  test('an HTTP request is redirected to the same URL over HTTPS', async () => {
    const res = await request('/api/health', { proto: 'http' });

    assert.strictEqual(res.status, 301);
    const location = res.headers.get('location');
    assert.ok(location.startsWith('https://'), `expected an https:// redirect, got ${location}`);
    assert.ok(location.endsWith('/api/health'), 'the path must be kept');
  });

  test('the query string survives the redirect', async () => {
    const res = await request('/api/health?check=db', { proto: 'http' });

    assert.strictEqual(res.status, 301);
    assert.ok(res.headers.get('location').endsWith('/api/health?check=db'));
  });

  test('an HTTPS request is passed through', async () => {
    const res = await request('/no-such-route', { proto: 'https' });

    // 404 means it reached the router instead of being redirected
    assert.strictEqual(res.status, 404);
  });

  test('with several proxies, the first scheme in the list decides', async () => {
    // "https,http" means the visitor used HTTPS and an inner hop used HTTP
    const secure = await request('/no-such-route', { proto: 'https,http' });
    assert.strictEqual(secure.status, 404);

    const insecure = await request('/no-such-route', { proto: 'http,https' });
    assert.strictEqual(insecure.status, 301);
  });

  test('a POST over HTTP is refused rather than redirected', async () => {
    const res = await request('/api/auth/login', { proto: 'http', method: 'POST' });

    // The body already crossed the network in plaintext, so re-sending it over
    // HTTPS would not undo the leak.
    assert.strictEqual(res.status, 403);
  });

  test('enforcement is off in development, so localhost still works', async () => {
    process.env.FORCE_HTTPS = 'false';

    const res = await request('/no-such-route', { proto: 'http' });
    assert.strictEqual(res.status, 404, 'plain HTTP must work locally');
  });

  test('security headers are set on every response', async () => {
    const res = await request('/no-such-route', { proto: 'https' });

    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.get('x-frame-options'), 'should set X-Frame-Options');
    assert.strictEqual(res.headers.get('x-powered-by'), null, 'should not advertise Express');
  });

  test('HSTS is sent when HTTPS is enforced, and not during development', async () => {
    const enforced = await request('/no-such-route', { proto: 'https' });
    assert.match(enforced.headers.get('strict-transport-security') || '', /max-age=\d+/);

    process.env.FORCE_HTTPS = 'false';
    const local = await request('/no-such-route', { proto: 'https' });
    // On localhost a browser would remember HSTS and then refuse plain http://localhost
    assert.strictEqual(local.headers.get('strict-transport-security'), null);
  });
});
