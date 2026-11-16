// Calls the sign-in and password reset routes under /api/auth, and manages the
// signed-in session in the browser (SCRUM-101).

// The login token lives in localStorage under this key. api/orders.js reads the same key.
const TOKEN_KEY = 'token'

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

// ---- Session (SCRUM-101) ----
//
// Logging out only clears the token in this browser, so the user's other devices stay
// signed in. A password reset is what signs out every device; the backend handles that
// by rejecting older tokens (see token_version in backend/middleware/auth.js).
//
// The expiry checks below read the token's `exp` field purely to update the UI on time.
// They prove nothing: the backend verifies every token on every request regardless.

// The token's expiry in milliseconds since 1970, or null if it can't be read.
function tokenExpiryMs(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(base64))
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

// The current login token, or null if signed out. An expired token is cleared on the way.
export function getSessionToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null

  const expiresAt = tokenExpiryMs(token)
  if (expiresAt !== null && expiresAt <= Date.now()) {
    clearSession()
    return null
  }
  return token
}

// Milliseconds until the current token expires, or null if there's no readable expiry.
export function msUntilSessionExpires() {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiresAt = token ? tokenExpiryMs(token) : null
  return expiresAt === null ? null : Math.max(0, expiresAt - Date.now())
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
}

// The "Log out" button: signs out of this browser only, then goes to the homepage.
export function logOut() {
  clearSession()
  window.location.href = '/'
}

// Called when the session runs out while a page is open. The login page reads
// ?expired=1 and explains why the user was sent there.
export function endExpiredSession() {
  clearSession()
  window.location.href = '/login?expired=1'
}
