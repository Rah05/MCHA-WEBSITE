import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import { requestPasswordReset } from '../api/auth'
import './Login.css'

// Step 1 of the reset flow (SCRUM-100): ask for an email, and the backend emails a link
// to /reset-password. The confirmation shown is the server's own wording, which is
// identical whether or not the address has an account, so this page never reveals it.
function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const data = await requestPasswordReset(email)
      setSentMessage(data.message)
    } catch (err) {
      setError(err.status ? err.message : 'Unable to connect to the backend. Make sure the backend is running.')
    }
    setSubmitting(false)
  }

  return (
    <main className="login-page">
      <Card title="Reset your password" className="login-card">
        {sentMessage ? (
          <p role="status">{sentMessage} Check your inbox, and your spam folder if it doesn't arrive.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="login-intro">
              Enter the email you signed up with and we'll send you a link to choose a new password.
            </p>

            <FormField
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            {error && <p className="login-error" role="alert">{error}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        )}

        <p className="login-text">
          <a href="/login">Back to log in</a>
        </p>
      </Card>
    </main>
  )
}

export default ForgotPassword
