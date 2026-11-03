/**
 * Password hashing helpers (SCRUM-54).
 *
 * All password storage and checking goes through this file so the algorithm and
 * its cost live in one place. Passwords are never stored in plaintext: only the
 * bcrypt hash is saved in `users.password_hash`.
 */
const bcrypt = require('bcrypt');

// Work factor for bcrypt. Each +1 doubles the time a hash takes, which makes
// brute-force guessing slower. 12 matches the registration code and takes
// roughly a quarter second per hash on a typical laptop.
const BCRYPT_ROUNDS = 12;

// bcrypt only reads the first 72 bytes of a password and silently ignores the rest,
// so longer passwords are rejected at hashing time instead of being quietly truncated.
const MAX_PASSWORD_BYTES = 72;

/**
 * Hashes a plaintext password with a fresh random salt.
 *
 * @param {string} plainPassword The password as typed by the user.
 * @returns {Promise<string>} The bcrypt hash to store in `users.password_hash`.
 * @throws {TypeError} If the password is not a non-empty string.
 * @throws {RangeError} If the password is longer than 72 bytes.
 */
async function hashPassword(plainPassword) {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
    throw new TypeError('Password must be a non-empty string');
  }
  if (Buffer.byteLength(plainPassword, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new RangeError(`Password must be at most ${MAX_PASSWORD_BYTES} bytes`);
  }
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

/**
 * Checks a plaintext password against a stored bcrypt hash.
 * Never throws for bad input, so callers can treat any problem as "no match".
 *
 * @param {string} plainPassword The password as typed by the user.
 * @param {string} storedHash    The value from `users.password_hash`.
 * @returns {Promise<boolean>} True only if the password matches the hash.
 */
async function verifyPassword(plainPassword, storedHash) {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) return false;
  if (typeof storedHash !== 'string' || storedHash.length === 0) return false;
  return bcrypt.compare(plainPassword, storedHash);
}

module.exports = { BCRYPT_ROUNDS, MAX_PASSWORD_BYTES, hashPassword, verifyPassword };
