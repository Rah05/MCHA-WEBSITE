const bcrypt = require('bcrypt')
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

  const normalizedEmail = email.trim().toLowerCase()

  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    )

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'An account with this email already exists',
      })
    }

    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = 'customer'"
    )

    const passwordHash = await bcrypt.hash(password, 12)

    const newUser = await pool.query(
      `INSERT INTO users
       (email, password_hash, role_id, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, created_at`,
      [
        normalizedEmail,
        passwordHash,
        roleResult.rows[0].id,
        firstName.trim(),
        lastName.trim(),
      ]
    )

    res.status(201).json({
      message: 'Account created successfully',
      user: newUser.rows[0],
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { register }
