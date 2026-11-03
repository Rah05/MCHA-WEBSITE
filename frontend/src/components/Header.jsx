
import { useState } from 'react'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

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
        <a href="/login">LOG IN</a>
        <a href="/cart">CART (2)</a>
      </div>
    </header>
  )
}

export default Header
