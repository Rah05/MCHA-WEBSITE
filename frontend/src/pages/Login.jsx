import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import { login } from '../api/auth'
import './Login.css'

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    setSubmitting(true)

    try {
      const data = await login(formData.email, formData.password)

      // Order history page reads the token from this same key.
      localStorage.setItem('token', data.token)
      window.location.href = '/'
    } catch (error) {
      if (error.status) {
        setMessage(error.message)
      } else {
        setMessage('Unable to connect to the backend. Make sure the backend is running.')
      }
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <Card title="Log in to M.CHA" className="login-card">
        <form onSubmit={handleSubmit}>
          <FormField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {message && <p className="login-error" role="alert">{message}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Log in'}
          </Button>
        </form>

        <p className="login-text">
          New here? <a href="/register">Create an account</a>
        </p>
      </Card>
    </main>
  )
}

export default Login