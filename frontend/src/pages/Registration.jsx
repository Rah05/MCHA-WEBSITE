import { useState } from 'react'
import './Registration.css'

function Registration() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (formData.password.length < 8) {
      setMessage('Password must be at least 8 characters.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    try {
      const response = await fetch(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Registration failed.')
        return
      }

      setMessage(data.message)

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      })
    } catch (error) {
      setMessage(
        'Unable to connect to the backend. Make sure the backend is running.'
      )
    }
  }

  return (
    <main className="registration-page">
      <section className="registration-card">
        <p className="eyebrow">ACCOUNT ACCESS</p>

        <h1>Create your M.CHA account</h1>

        <p className="subtitle">
          Join M.CHA Rewards and manage your orders.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="name-row">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Optional"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              minLength="8"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              minLength="8"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <label className="checkbox-row">
            <input type="checkbox" />
            <span>Join M.CHA Rewards and earn points</span>
          </label>

          <button type="submit">CREATE ACCOUNT</button>

          {message && <p className="form-message">{message}</p>}
        </form>

        <p className="login-text">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </section>
    </main>
  )
}

export default Registration