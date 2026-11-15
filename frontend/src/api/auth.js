// Calls sign-in route. Forgot password + reset password functionality goes here

export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.error || 'Sign-in failed. Please try again.')
    error.status = res.status
    throw error
  }

  return data // { token, user }
}