import { useEffect, useState } from 'react'
import { getSessionToken, msUntilSessionExpires, logOut, endExpiredSession } from '../api/auth'

// setTimeout can't wait longer than this (about 24.8 days); longer waits fire immediately.
const MAX_TIMEOUT_MS = 2 ** 31 - 1

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [signedIn] = useState(() => Boolean(getSessionToken()))

  // Session expiry (SCRUM-101): if the token runs out while this page is open, sign out
  // and send the user to log in again, rather than leaving a page that silently fails.
  useEffect(() => {
    if (!signedIn) return
    const ms = msUntilSessionExpires()
    if (ms === null || ms > MAX_TIMEOUT_MS) return
    const timer = setTimeout(endExpiredSession, ms)
    return () => clearTimeout(timer)
  }, [signedIn])

  return (
    <header className="header">
      <a href="/" className="logo">M.CHA</a>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
      >
        ☰
      </button>

      <nav className={`navigation ${menuOpen ? 'active' : ''}`}>
        <a href="/shop">SHOP</a>
        <a href="/wholesale">WHOLESALE</a>
        <a href="/schedule">SCHEDULE</a>
        <a href="/events">EVENTS</a>
        <a href="/tea-info">TEA INFO</a>
        <a href="/about">ABOUT</a>
      </nav>

      <div className="header-actions">
        {signedIn ? (
          <button type="button" className="header-logout" onClick={logOut}>
            LOG OUT
          </button>
        ) : (
          <a href="/login">LOG IN</a>
        )}
        <a href="/cart">CART (2)</a>
      </div>
    </header>
  )
}

export default Header
