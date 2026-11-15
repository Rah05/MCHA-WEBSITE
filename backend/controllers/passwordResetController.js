/**
 * Forgot / reset password controller (SCRUM-100).
 *
 * The flow is two requests with an email in between:
 *   1. POST /api/auth/forgot-password  records a reset token, emails the link.
 *   2. POST /api/auth/reset-password   trades that token for a new password.
 *
 * Both endpoints are unauthenticated, which is unavoidable: a user who has forgotten
 * their password has no way to prove who they are. The email inbox is the proof. That
 * makes these two of the more exposed endpoints in the API, so the rules below are
 * about giving an anonymous caller as little as possible.
 *
 * Two properties this file is built to hold:
 *
 *   - Neither endpoint reveals whether an email address has an account. See
 *     FORGOT_PASSWORD_REPLY.
 *   - A reset link works once, for a limited time, and only for the account it was
 *     issued to. See resetPassword.
 *
 * @see utils/resetToken.js for why only the token's hash is stored.
 */
 const pool = require('../db/pool');
 const { hashPassword } = require('../utils/password');
 const { createResetToken, hashResetToken, TOKEN_TTL_MINUTES } = require('../utils/resetToken');
 const { sendMail } = require('../utils/mailer');
 
 // Kept in step with the registration form's minimum. If this were lower, the reset
 // flow would become a way around the sign-up rules: register with a strong password,
 // then immediately reset to a weak one.
 const MIN_PASSWORD_LENGTH = 8;
 
 // The origin the reset link points at, which is the frontend rather than this API.
 // Defaults to the Vite dev server so the flow works on a fresh clone with no extra
 // setup; production sets APP_URL to the deployed site (SCRUM-137).
 const APP_URL = process.env.APP_URL || 'http://localhost:5173';
 
 /**
  * The single reply this endpoint ever gives, whether or not the email is registered.
  *
  * The attack this prevents is account enumeration. If an unregistered address came
  * back with "no account found", anyone could feed the endpoint a list of addresses
  * and walk away knowing which of them are M.CHA customers. That is worth having on
  * its own, and it is worth more to people who would rather not be publicly linked to
  * any particular site.
  *
  * The login endpoint closes the same hole from the other side, which is why a wrong
  * email and a wrong password there produce one identical message.
  */
 const FORGOT_PASSWORD_REPLY = {
   message: 'If that email has an account, a reset link is on its way.',
 };
 
 /**
  * Builds the reset email.
  *
  * The last line matters more than it looks. Someone who did not request this needs to
  * be told plainly that ignoring the email is safe and sufficient, otherwise the honest
  * reaction to an unexpected password email is to click the link to find out what it
  * is, which is the behaviour a phisher is counting on.
  */
 function resetEmailBody(firstName, link) {
   const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
   return [
     greeting,
     '',
     'Someone asked to reset the password on your M.CHA account. Open the link',
     'below to choose a new one:',
     '',
     link,
     '',
     `The link stops working in ${TOKEN_TTL_MINUTES} minutes, and once you use it.`,
     '',
     "If this wasn't you, nothing has changed and you can ignore this email.",
     '',
     '— M.CHA',
   ].join('\n');
 }
 
 /**
  * POST /api/auth/forgot-password
  *
  * Known gap: there is no rate limit on this endpoint, so nothing stops someone
  * requesting resets for one address repeatedly and filling that inbox. The fix is a
  * per-address and per-IP throttle, which belongs with the deployment work in
  * SCRUM-137, since the limiter needs to sit in front of the app rather than inside it.
  *
  * @param {string} req.body.email The account email. Case and surrounding whitespace are ignored.
  * @returns 200 with FORGOT_PASSWORD_REPLY in every case, registered or not.
  *          400 only when the request itself is malformed.
  */
 async function forgotPassword(req, res, next) {
   const { email } = req.body || {};
 
   // A missing field is a bug in the caller, not a guess at an address, so saying so
   // gives an attacker nothing. Note this is a check on the shape of the request and
   // never on whether the address exists.
   if (typeof email !== 'string' || !email.trim()) {
     return res.status(400).json({ error: 'Email is required' });
   }
 
   // Registration lowercases before storing, so the same normalisation has to happen
   // here or "Noah@example.com" would silently fail to find "noah@example.com".
   const normalizedEmail = email.trim().toLowerCase();
 
   try {
     const [rows] = await pool.query(
       'SELECT id, email, first_name FROM users WHERE email = ?',
       [normalizedEmail]
     );
     const user = rows[0];
 
     // No account: do nothing, and say the same thing as if there had been one.
     //
     // Being straight about the limit here. This path returns sooner than the one
     // below, which hashes a token, writes a row, and sends mail, so a caller timing
     // the responses could still infer which addresses exist. Closing that properly
     // means doing the work off the request, by queueing the email and replying
     // immediately in both cases, which needs the background job setup that this
     // project does not have yet. The response body gives nothing away, which is the
     // part that matters for a casual attempt; the timing channel is a real but
     // narrower hole, and it is logged here so the next person knows it was weighed
     // rather than missed.
     if (!user) {
       return res.json(FORGOT_PASSWORD_REPLY);
     }
 
     const { token, tokenHash, expiresAt } = createResetToken();
 
     // A plain overwrite, which quietly does something useful: requesting a second
     // link invalidates the first. Someone who asks twice because the first mail was
     // slow ends up with exactly one working link rather than two live ones.
     await pool.query(
       'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
       [tokenHash, expiresAt, user.id]
     );
 
     const link = `${APP_URL}/reset-password?token=${token}`;
 
     try {
       await sendMail({
         to: user.email,
         subject: 'Reset your M.CHA password',
         text: resetEmailBody(user.first_name, link),
       });
     } catch (mailError) {
       // Deliberately swallowed. Letting this reach the error handler would return a
       // 500 for registered addresses while unregistered ones still got a 200, which
       // would rebuild the enumeration channel this endpoint is built to close, and
       // during an outage it would be trivially observable.
       //
       // Nothing is lost by continuing: the token is already saved, so the user can
       // request another link once mail is working again.
       console.error('Could not send the password reset email:', mailError);
     }
 
     res.json(FORGOT_PASSWORD_REPLY);
   } catch (err) {
     next(err);
   }
 }
 
 /**
  * POST /api/auth/reset-password
  *
  * @param {string} req.body.token    The token from the emailed link.
  * @param {string} req.body.password The new password.
  * @returns 200 once the password has been changed.
  *          400 for a malformed request, a password that fails the length rules, or a
  *              token that is unknown, expired, or already spent.
  */
 async function resetPassword(req, res, next) {
   const { token, password } = req.body || {};
 
   if (typeof token !== 'string' || !token.trim()) {
     return res.status(400).json({ error: 'Reset token is required' });
   }
   if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
     return res
       .status(400)
       .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
   }
 
   try {
     // Two things are being asked at once here, and both belong in the query.
     //
     // The token is matched by hash because the raw value was never stored. The expiry
     // is compared with UTC_TIMESTAMP() rather than a JavaScript Date so that one clock
     // decides, the database's. The pool pins every connection to UTC, so this reads
     // the column the same way createResetToken wrote it. Comparing in Node would mean
     // trusting the app server's clock to agree with the database's, which is a bug
     // that only appears once they are on different machines.
     const [rows] = await pool.query(
       `SELECT id FROM users
        WHERE reset_token = ? AND reset_token_expires > UTC_TIMESTAMP()`,
       [hashResetToken(token.trim())]
     );
     const user = rows[0];
 
     // One message covers a token that never existed, one that has expired, and one
     // already used. Distinguishing them would confirm to someone guessing tokens that
     // a particular value was real once, which is a foothold worth denying. The user
     // who legitimately clicked an old link needs to do the same thing in all three
     // cases anyway, which is request a new one.
     if (!user) {
       return res
         .status(400)
         .json({ error: 'This reset link has expired or has already been used' });
     }
 
     let newHash;
     try {
       newHash = await hashPassword(password);
     } catch (hashError) {
       // hashPassword throws RangeError past bcrypt's 72-byte ceiling. Translated to a
       // 400 because an over-long password is the caller's input problem, not a server
       // fault, and letting it reach the error handler would report it as a 500.
       if (hashError instanceof RangeError) {
         return res.status(400).json({ error: 'Password is too long' });
       }
       throw hashError;
     }
 
     // Clearing the token in the same statement that sets the password is what makes
     // the link single use. Two separate statements would leave a window where the
     // password had changed but the old link still worked.
     await pool.query(
       `UPDATE users
        SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL
        WHERE id = ?`,
       [newHash, user.id]
     );
 
     // Worth knowing for SCRUM-101: any login token issued before this point keeps
     // working until it expires on its own, because the tokens are stateless and the
     // server holds no session to revoke. If the team later decides a password reset
     // should kick existing sessions out, that is the change to make and this is where
     // it would go.
     res.json({ message: 'Password updated. You can sign in with your new password.' });
   } catch (err) {
     next(err);
   }
 }
 
 module.exports = { MIN_PASSWORD_LENGTH, forgotPassword, resetPassword };