// Password hashing tests (SCRUM-54). Run with: npm test
// These tests need no database.
const { describe, test } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcrypt');

const { BCRYPT_ROUNDS, MAX_PASSWORD_BYTES, hashPassword, verifyPassword } = require('../utils/password');

describe('password hashing (SCRUM-54)', () => {
  test('a hash never contains the plaintext password', async () => {
    const password = 'correct horse battery staple';
    const hash = await hashPassword(password);

    assert.notStrictEqual(hash, password);
    assert.ok(!hash.includes(password), 'the hash must not contain the password');
  });

  test('hashes use bcrypt at the agreed cost', async () => {
    const hash = await hashPassword('another-password');

    // bcrypt hashes look like $2b$<rounds>$<salt+digest>
    assert.match(hash, /^\$2[aby]\$\d{2}\$/, 'should be a bcrypt hash');
    assert.strictEqual(bcrypt.getRounds(hash), BCRYPT_ROUNDS);
  });

  test('the same password hashes differently every time (random salt)', async () => {
    const password = 'repeated-password';
    const first = await hashPassword(password);
    const second = await hashPassword(password);

    // Equal hashes would mean no salt, which lets attackers spot shared passwords.
    assert.notStrictEqual(first, second);
    assert.ok(await verifyPassword(password, first));
    assert.ok(await verifyPassword(password, second));
  });

  test('verifyPassword accepts the right password and rejects wrong ones', async () => {
    const hash = await hashPassword('Sacramento-Matcha-2026');

    assert.strictEqual(await verifyPassword('Sacramento-Matcha-2026', hash), true);
    assert.strictEqual(await verifyPassword('sacramento-matcha-2026', hash), false, 'should be case sensitive');
    assert.strictEqual(await verifyPassword('wrong-password', hash), false);
    assert.strictEqual(await verifyPassword('', hash), false);
  });

  test('verifyPassword returns false instead of throwing on bad input', async () => {
    const hash = await hashPassword('some-password');

    assert.strictEqual(await verifyPassword(null, hash), false);
    assert.strictEqual(await verifyPassword('some-password', null), false);
    assert.strictEqual(await verifyPassword('some-password', 'not-a-hash'), false);
  });

  test('empty and over-long passwords are rejected', async () => {
    await assert.rejects(() => hashPassword(''), TypeError);
    await assert.rejects(() => hashPassword(undefined), TypeError);

    // bcrypt ignores anything past 72 bytes, so we refuse it rather than silently truncating.
    const tooLong = 'a'.repeat(MAX_PASSWORD_BYTES + 1);
    await assert.rejects(() => hashPassword(tooLong), RangeError);
  });
});
