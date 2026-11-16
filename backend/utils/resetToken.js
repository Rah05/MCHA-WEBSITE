/**
 * Password reset token helpers (SCRUM-100).
 *
 * The threat this file exists to handle: if someone gets a copy of the database,
 * whether through a dump, a backup, or SQL injection, they must not come away with
 * working reset links for every account. Storing the raw token would hand them
 * exactly that, because a reset link is a temporary password in all but name.
 *
 * So the token is split in two. The raw value goes out in the email and is never
 * written down. Its hash is what lives in `users.reset_token`, and a hash cannot be
 * turned back into a link.
 *
 * @see controllers/passwordResetController.js for the endpoints that use these.
 */
 const crypto = require('crypto');

 // 32 bytes from the OS random source, rendered as 64 hex characters. Hex rather
 // than base64 so the token survives being pasted into a URL with no escaping, and
 // 32 bytes because a shorter token could plausibly be guessed by an attacker who
 // is willing to send a lot of requests at an endpoint we do not yet rate limit.
 const TOKEN_BYTES = 32;
 
 // The window a reset link stays good for.
 //
 // This is a trade-off, not a magic number. Too long and an old email sitting in an
 // abandoned inbox is still a way into the account months later. Too short and a
 // user who checks mail on their phone, walks back to their laptop, and types a new
 // password finds the link dead. An hour covers the realistic path without leaving
 // the link useful to anyone who finds it later.
 const TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES) || 60;
 
 /**
  * Hashes a reset token, both when storing a new one and when looking one up.
  *
  * SHA-256 here, bcrypt for passwords, and the difference is deliberate. bcrypt is
  * slow on purpose because a human-chosen password is guessable and the slowness is
  * what makes guessing impractical. A reset token has no such weakness: it is 256
  * bits of randomness, so there is no shortcut for an attacker to be slowed down on.
  *
  * Speed also matters in the other direction. bcrypt generates a new salt per hash,
  * so the same token hashes differently every time and could only be found by
  * reading every row and comparing one at a time. SHA-256 is deterministic, which
  * means the hash can go straight into a WHERE clause and hit the index.
  *
  * @param {string} token The raw token taken from the reset link.
  * @returns {string} 64 hex characters, matching what is stored in `users.reset_token`.
  */
 function hashResetToken(token) {
   return crypto.createHash('sha256').update(token).digest('hex');
 }
 
 /**
  * Mints a reset token and the two values the database needs to record alongside it.
  *
  * Note that `expiresAt` is a JavaScript Date rather than a formatted string. The
  * connection pool is configured with `timezone: 'Z'`, so mysql2 converts it to UTC
  * on the way into the DATETIME column. Formatting it here by hand would reintroduce
  * exactly the timezone bug that configuration exists to prevent.
  *
  * @returns {{token: string, tokenHash: string, expiresAt: Date}}
  *   `token` belongs in the emailed link and must not be persisted.
  *   `tokenHash` and `expiresAt` belong in `users.reset_token` and
  *   `users.reset_token_expires`.
  */
 function createResetToken() {
   const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
   return {
     token,
     tokenHash: hashResetToken(token),
     expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000),
   };
 }
 
 module.exports = { TOKEN_BYTES, TOKEN_TTL_MINUTES, createResetToken, hashResetToken };