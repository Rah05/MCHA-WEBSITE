/**
 * Sign-in controller (SCRUM-98).
 *
 * Checks an email and password against the `users` table and, if they match,
 * returns a signed login token. The frontend sends that token on later requests
 * as `Authorization: Bearer <token>`, which `middleware/auth.js` verifies.
 */
const pool = require('../db/pool');
const { signToken } = require('../middleware/auth');
const { verifyPassword } = require('../utils/password');

// A real bcrypt hash (cost 12) of a random string that nobody knows.
// When an email isn't registered we still compare the password against this hash,
// so a failed login takes about the same time either way. Without it, a fast
// response would reveal which email addresses have accounts.
const DUMMY_HASH = '$2b$12$5yNi2Y0fcPeMLY2L4.bE6OngXpi44SNaqALn7Qe7WfSsBTvl80K/K';

// One message for every kind of credential failure, so the response never says
// whether the email or the password was the wrong part.
const INVALID_CREDENTIALS = { error: 'Invalid email or password' };

/**
 * POST /api/auth/login
 *
 * @param {string} req.body.email    The account email. Case and surrounding spaces are ignored.
 * @param {string} req.body.password The plaintext password. Only compared against the stored hash.
 * @returns 200 { token, user } on success.
 *          400 if the email or password is missing or not a string.
 *          401 if the credentials are wrong.
 */
async function login(req, res, next) {
  const { email, password } = req.body || {};

  // Reject non-strings up front, e.g. a JSON object sent in place of a password.
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Emails are stored lowercase at registration, so normalize the same way here.
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [rows] = await pool.query(
      `SELECT users.id, users.email, users.password_hash, users.first_name, users.last_name,
              roles.name AS role
       FROM users JOIN roles ON roles.id = users.role_id
       WHERE users.email = ?`,
      [normalizedEmail]
    );
    const user = rows[0];

    // Always run one bcrypt comparison, even for an unknown email (see DUMMY_HASH).
    const passwordMatches = await verifyPassword(password, user ? user.password_hash : DUMMY_HASH);

    if (!user || !passwordMatches) {
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    // Never send `password_hash` back to the client. Only these fields leave the server.
    res.json({
      token: signToken(user),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
