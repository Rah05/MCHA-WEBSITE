// Calls the sign-in and password reset routes under /api/auth.

// Shared by every call here: sends JSON, and turns a non-2xx reply into an Error
// carrying the server's message and status. An Error without a status means the
// request never reached the backend, which the pages report differently.
async function postJson(url, body, fallbackMessage) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.error || fallbackMessage)
    error.status = res.status
    throw error
  }

  return data
}

export function login(email, password) {
  return postJson('/api/auth/login', { email, password }, 'Sign-in failed. Please try again.') // { token, user }
}

// The reply is the same whether or not the email has an account (SCRUM-100).
export function requestPasswordReset(email) {
  return postJson('/api/auth/forgot-password', { email }, 'Could not send a reset link. Please try again.') // { message }
}

export function resetPassword(token, password) {
  return postJson('/api/auth/reset-password', { token, password }, 'Could not reset your password. Please try again.') // { message }
}
