const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// Roles match the `roles` table. A visitor with no token is a "guest".
// WHOLESALE is a business account an admin has approved to see wholesale prices (SCRUM-89).
const ROLES = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
  WHOLESALE: 'wholesale',
});

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in backend/.env');
  }
  return process.env.JWT_SECRET;
}

// Create a login token for a user. Call this from the sign-in endpoint after the password checks out:
//   const token = signToken(user);  // user needs an `id`, and should include `token_version`
//   res.json({ token });
//
// `ver` is the user's token_version when the token was issued (SCRUM-101). Raising
// users.token_version makes every older token fail in loadUser, which is how a password
// reset signs the user out on every device. A user row without the field counts as 0.
function signToken(user) {
  return jwt.sign({ sub: String(user.id), ver: user.token_version || 0 }, getSecret(), {

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
// Returns null (treated as signed out) if the token was issued before the user's last
// "sign out everywhere", i.e. its `ver` is behind users.token_version (SCRUM-101).
// Tokens issued before `ver` existed count as version 0, so they keep working until they expire.
async function loadUser(token) {
  const payload = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
  const [rows] = await pool.query(
    `SELECT users.id, users.email, users.first_name, users.last_name, users.token_version,
            roles.name AS role
     FROM users JOIN roles ON roles.id = users.role_id
     WHERE users.id = ?`,
    [payload.sub]
  );
  const user = rows[0];
  if (!user || (payload.ver || 0) !== user.token_version) {
    return null;
  }
  delete user.token_version; // internal; req.user keeps its documented shape
  return user;
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

// For public pages that show more to some signed-in users, such as wholesale prices in the
// shop (SCRUM-89). It never blocks the request: no token, or a token that is invalid,
// expired, or signed out, all carry on as a guest (req.user = null). That is the
// difference from optionalAuth, which answers 401 for a bad token. A shopper with a stale
// token in their browser should still see the shop, just with guest prices.
async function identifyUser(req, res, next) {
  req.user = null;
  const token = readBearerToken(req);
  if (token) {
    try {
      req.user = await loadUser(token);
    } catch (err) {
      if (!(err instanceof jwt.JsonWebTokenError)) {
        return next(err); // a database error is a real fault, not a guest
      }
    }
  }
  return next();
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
  identifyUser,
  requireRole,
  requireSelfOrRole,
};
