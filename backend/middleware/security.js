/**
 * HTTPS enforcement and security headers (SCRUM-53).
 *
 * In production the API sits behind the host's load balancer (Render, Vercel, and
 * similar). The host handles the TLS certificate and forwards the request to this
 * server over plain HTTP inside its own network, so `req.secure` is false even when
 * the visitor used HTTPS. The original scheme arrives in the `x-forwarded-proto`
 * header, which is what this file reads.
 *
 * Enforcement is off during local development, because localhost has no certificate
 * and redirecting would make the API unreachable from `npm run dev`.
 */
const helmet = require('helmet');

/**
 * Whether HTTPS should be enforced for this request.
 * Read at request time (not at startup) so tests can switch it on and off.
 *
 * `FORCE_HTTPS` in backend/.env wins if set; otherwise it follows NODE_ENV.
 * @returns {boolean}
 */
function httpsEnforcementEnabled() {
  if (process.env.FORCE_HTTPS === 'true') return true;
  if (process.env.FORCE_HTTPS === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

/**
 * Whether the visitor reached us over HTTPS.
 *
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function requestIsSecure(req) {
  const forwarded = req.headers['x-forwarded-proto'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    // With more than one proxy the header is a list ("https,http").
    // The first entry is the scheme the visitor actually used.
    return forwarded.split(',')[0].trim() === 'https';
  }
  // No proxy in front of us: trust Express's own view of the connection.
  return req.secure;
}

/**
 * Sends HTTP visitors to the HTTPS version of the same URL.
 *
 * GET and HEAD are redirected with 301. Other methods are refused with 403 instead:
 * a POST body has already crossed the network in plaintext by the time it reaches us,
 * so redirecting it would re-send leaked data and hide the mistake from the caller.
 */
function enforceHttps(req, res, next) {
  if (!httpsEnforcementEnabled() || requestIsSecure(req)) {
    return next();
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  return res.status(403).json({ error: 'HTTPS is required for this request' });
}

/**
 * Security response headers, via helmet.
 *
 * Two defaults are changed:
 * - HSTS is only sent when HTTPS is enforced. A browser that sees it on localhost
 *   remembers it and then refuses to load http://localhost, which breaks local work
 *   for anything else served from the same host.
 * - Cross-Origin-Resource-Policy is relaxed to "cross-origin" because the React app
 *   runs on a different origin (port 5173 in development, its own domain in production).
 *
 * @returns {import('express').RequestHandler}
 */
function securityHeaders() {
  const common = { crossOriginResourcePolicy: { policy: 'cross-origin' } };
  // Built once at startup, then chosen per request, so the HSTS decision follows
  // the current environment instead of whatever it was when the server booted.
  const withHsts = helmet({ ...common, hsts: { maxAge: 15552000, includeSubDomains: true } });
  const withoutHsts = helmet({ ...common, hsts: false });

  return (req, res, next) =>
    httpsEnforcementEnabled() ? withHsts(req, res, next) : withoutHsts(req, res, next);
}

module.exports = { enforceHttps, securityHeaders, httpsEnforcementEnabled, requestIsSecure };
