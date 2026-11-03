const { hashPassword, MAX_PASSWORD_BYTES } = require('../utils/password')
const pool = require('../db/pool')

async function register(req, res, next) {
  const { firstName, lastName, email, phone, password } = req.body

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      error: 'First name, last name, email, and password are required',
    })
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters',
    })
  }

  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    return res.status(400).json({
      error: 'Password is too long',
    })
  }

  const normalizedEmail = email.trim().toLowerCase()

  try {
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'An account with this email already exists',
      })
    }

    const [roles] = await pool.query(
      "SELECT id FROM roles WHERE name = 'customer'"
    )

    const passwordHash = await hashPassword(password)

    const [result] = await pool.query(
      `INSERT INTO users
       (email, password_hash, role_id, first_name, last_name)
       VALUES (?, ?, ?, ?, ?)`,
      [
        normalizedEmail,
        passwordHash,
        roles[0].id,
        firstName.trim(),
        lastName.trim(),
      ]
    )

    // MySQL has no RETURNING, so read the new row back by its id
    const [newUsers] = await pool.query(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?',
      [result.insertId]
    )

    res.status(201).json({
      message: 'Account created successfully',
      user: newUsers[0],
    })
  } catch (error) {
    // Two sign-ups with the same email at the same moment can both pass the check above
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'An account with this email already exists',
      })
    }
    next(error)
  }
}

module.exports = { register }
