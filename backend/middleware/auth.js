const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// Roles match the `roles` table. A visitor with no token is a "guest".
const ROLES = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
});

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in backend/.env');
  }
  return process.env.JWT_SECRET;
}

// Create a login token for a user. Call this from the sign-in endpoint after the password checks out:
//   const token = signToken(user);  // user needs an `id`
//   res.json({ token });
function signToken(user) {
  return jwt.sign({ sub: String(user.id) }, getSecret(), {
    algorithm: 'HS256',
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

function readBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

// Looks up the user on every request, so a deleted user or a role change takes effect right away
// (a token alone would keep its old role until it expires).
async function loadUser(token) {
  const payload = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
  const [rows] = await pool.query(
    `SELECT users.id, users.email, users.first_name, users.last_name, roles.name AS role
     FROM users JOIN roles ON roles.id = users.role_id
     WHERE users.id = ?`,
    [payload.sub]
  );
  return rows[0] || null;
}

// Requires a valid login. Sets req.user = { id, email, first_name, last_name, role }.
// Responds 401 if the token is missing, invalid, expired, or the user no longer exists.
async function requireAuth(req, res, next) {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Please sign in to continue' });
  }

  try {
    const user = await loadUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Please sign in to continue' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      // Covers bad signatures, malformed tokens, and expired tokens (TokenExpiredError)
      return res.status(401).json({ error: 'Your session has expired. Please sign in again' });
    }
    next(err);
  }
}

// Like requireAuth, but guests are allowed through. req.user is the user, or null for a guest.
// Use for pages that work for everyone but show more when signed in.
async function optionalAuth(req, res, next) {
  const token = readBearerToken(req);
  if (!token) {
    req.user = null;
    return next();
  }
  return requireAuth(req, res, next);
}

// Allows only the listed roles. Always use after requireAuth.
//   router.post('/products', requireAuth, requireRole(ROLES.ADMIN), createProduct);
//   router.get('/schedules', requireAuth, requireRole(ROLES.ADMIN, ROLES.STAFF), listSchedules);
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Please sign in to continue' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this' });
    }
    next();
  };
}

// Lets a user act on their own record, or anyone with one of the listed roles.
// Reads the target user id from req.params[paramName]. Always use after requireAuth.
//   router.get('/users/:userId/orders', requireAuth, requireSelfOrRole('userId', ROLES.ADMIN), listOrders);
function requireSelfOrRole(paramName, ...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Please sign in to continue' });
    }
    const isSelf = String(req.user.id) === String(req.params[paramName]);
    if (!isSelf && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this' });
    }
    next();
  };
}

module.exports = {
  ROLES,
  signToken,
  requireAuth,
  optionalAuth,
  requireRole,
  requireSelfOrRole,
};
