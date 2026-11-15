import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import { resetPassword } from '../api/auth'
import './Login.css'

// Same minimum as registration and the backend (MIN_PASSWORD_LENGTH in
// passwordResetController.js). The backend enforces it; this check just saves a round trip.
const MIN_PASSWORD_LENGTH = 8

// Step 2 of the reset flow (SCRUM-100): the emailed link lands here as
// /reset-password?token=..., and the token is sent back with the new password.
function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get('token') || ''

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previousData) => ({ ...previousData, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const data = await resetPassword(token, formData.password)
      setDone(data.message)
    } catch (err) {
      setError(err.status ? err.message : 'Unable to connect to the backend. Make sure the backend is running.')
    }
    setSubmitting(false)
  }

  // Opened without a token, e.g. the link was cut off when copied out of the email.
  if (!token) {
    return (
      <main className="login-page">
        <Card title="Reset link missing" className="login-card">
          <p>This page needs the link from your reset email. Try opening it again, or request a new one.</p>
          <p className="login-text">
            <a href="/forgot-password">Request a new reset link</a>
          </p>
        </Card>
      </main>
    )
  }

  return (
    <main className="login-page">
      <Card title="Choose a new password" className="login-card">
        {done ? (
          <>
            <p role="status">{done}</p>
            <Button href="/login">Log in</Button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormField
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              value={formData.password}
              onChange={handleChange}
              required
            />

            <FormField
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            {error && <p className="login-error" role="alert">{error}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Set new password'}
            </Button>
          </form>
        )}

        {/* Expired or used links are the common failure, so the way out is always on screen. */}
        {!done && (
          <p className="login-text">
            <a href="/forgot-password">Request a new reset link</a>
          </p>
        )}
      </Card>
    </main>
  )
}

export default ResetPassword
