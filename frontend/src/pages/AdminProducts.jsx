
import { useMemo, useState } from 'react'
import './AdminProducts.css'

const initialProducts = [
  { name: 'M. Blend 30g', category: 'Matcha', retail: 30, wholesale: 21, stock: '42 in stock', availability: 'Available' },
  { name: 'Ceremonial Uji 20g', category: 'Matcha', retail: 38, wholesale: 27.5, stock: '6 left', availability: 'Available' },
  { name: 'Hojicha 50g', category: 'Roasted tea', retail: 18, wholesale: 12, stock: '31 in stock', availability: 'Available' },
  { name: 'Chawan bowl — Kyoto glaze', category: 'Teaware', retail: 64, wholesale: 44, stock: '4 left', availability: 'Available' },
  { name: 'Bamboo chasen whisk', category: 'Teaware', retail: 24, wholesale: 15, stock: '18 in stock', availability: 'Available' },
  { name: 'Iced Matcha Latte', category: 'Drinks (pop-up)', retail: 7, wholesale: null, stock: 'Made to order', availability: 'Pop-ups only' },
  { name: 'Yuzu Matcha Soda', category: 'Drinks (pop-up)', retail: 8, wholesale: null, stock: 'Seasonal', availability: 'Hidden' },
]

const accounts = [
  { business: 'Kōyō Café', contact: 'mina@koyocafe.com', tier: 'Tier 2', minimum: '2 kg', status: 'Active' },
  { business: 'Midtown Bakehouse', contact: 'orders@midtownbake.co', tier: 'Tier 1', minimum: '1 kg', status: 'Active' },
  { business: 'Leaf & Bean Co.', contact: 'hello@leafbean.com', tier: '—', minimum: '1 kg', status: 'Pending' },
  { business: 'Sora Tea Bar', contact: 'sora.teabar@gmail.com', tier: '—', minimum: '2 kg', status: 'Pending' },
]

function AdminProducts() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [notice, setNotice] = useState('')

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase())

      const matchesCategory =
        category === 'All' ||
        (category === 'Matcha & tea' &&
          ['Matcha', 'Roasted tea'].includes(product.category)) ||
        product.category === category

      return matchesSearch && matchesCategory
    })
  }, [search, category])

  const showComingSoon = () => {
    setNotice('Product actions will be connected to the product management features.')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-name">M.CHA</span>
          <span className="admin-brand-label">ADMIN</span>
        </div>

        <nav className="admin-nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#products" className="active">Products & Pricing</a>
          <a href="#wholesale">Wholesale</a>
          <a href="#popups">Pop-ups & Calendar</a>
          <a href="#events">Event Requests</a>
          <a href="#orders">Orders & Inquiries</a>
          <a href="#schedules">Employee Schedules</a>
          <a href="#visitors">Visitor Records</a>
        </nav>

        <div className="admin-user">
          <div className="admin-avatar">A</div>
          <div>
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>
          <a href="/" className="sign-out">Sign out →</a>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">M.CHA / ADMIN</span>
            <h1>Products & Pricing</h1>
          </div>

          <label className="admin-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search products…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <button
            className="admin-primary-button"
            onClick={showComingSoon}
          >
            + ADD PRODUCT
          </button>
        </header>

        <p className="admin-intro">
          Manage what customers see in the shop, at pop-ups, and on wholesale price sheets.
        </p>

        {notice && (
          <div className="admin-notice" role="status">
            {notice}
            <button
              onClick={() => setNotice('')}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        <section className="admin-stats">
          <div className="admin-stat">
            <span>ACTIVE PRODUCTS</span>
            <strong>24</strong>
            <small>Visible in shop</small>
          </div>

          <div className="admin-stat">
            <span>LOW STOCK</span>
            <strong>3</strong>
            <small>Reorder soon</small>
          </div>

          <div className="admin-stat">
            <span>HIDDEN / SOLD OUT</span>
            <strong>2</strong>
            <small>Not shown to customers</small>
          </div>

          <div className="admin-stat">
            <span>WHOLESALE ACCOUNTS</span>
            <strong>6</strong>
            <small>2 pending review</small>
          </div>
        </section>

        {/* Products and Pricing */}
        <section className="admin-section" id="products">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">CATALOG</span>
              <h2>Products & Pricing</h2>
            </div>
            <span className="admin-publish-note">
              Changes publish to the shop instantly
            </span>
          </div>

          <div className="admin-filters">
            {['All', 'Matcha & tea', 'Teaware', 'Drinks (pop-up)'].map((item) => (
              <button
                key={item}
                className={category === item ? 'selected' : ''}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>CATEGORY</th>
                  <th>RETAIL PRICE</th>
                  <th>WHOLESALE</th>
                  <th>STOCK</th>
                  <th>AVAILABILITY</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.name}>
                    <td className="product-name">{product.name}</td>
                    <td>{product.category}</td>
                    <td>${product.retail.toFixed(2)}</td>
                    <td>
                      {product.wholesale === null
                        ? '—'
                        : `$${product.wholesale.toFixed(2)}`}
                    </td>
                    <td>{product.stock}</td>
                    <td>
                      <span
                        className={`availability ${
                          product.availability === 'Hidden' ? 'hidden' : ''
                        }`}
                      >
                        {product.availability}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-edit-button"
                        onClick={showComingSoon}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="admin-empty">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Wholesale Information */}
        <section
          className="admin-section wholesale-section"
          id="wholesale"
        >
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">BUSINESS CUSTOMERS</span>
              <h2>Wholesale Information</h2>
              <p>Cafés and shops buying M.CHA in bulk</p>
            </div>

            <button
              className="admin-secondary-button"
              onClick={showComingSoon}
            >
              + ADD ACCOUNT
            </button>
          </div>

          <div className="wholesale-content">

            {/* Left side: Wholesale Accounts */}
            <div className="admin-table-wrap accounts-table-wrap">
              <table className="admin-table accounts-table">
                <thead>
                  <tr>
                    <th>BUSINESS</th>
                    <th>CONTACT</th>
                    <th>TIER</th>
                    <th>MIN. ORDER</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.business}>
                      <td className="product-name">
                        {account.business}
                      </td>
                      <td>{account.contact}</td>
                      <td>{account.tier}</td>
                      <td>{account.minimum}</td>
                      <td>
                        <span
                          className={`availability ${
                            account.status === 'Pending' ? 'pending' : ''
                          }`}
                        >
                          {account.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right side: Wholesale Price Tiers */}
            <div className="wholesale-tiers">
              <h3>Wholesale price tiers</h3>

              <div className="tier-item">
                <strong>Tier 1</strong>
                <span>30% off retail</span>
                <small>1–4 kg / month</small>
              </div>

              <div className="tier-item">
                <strong>Tier 2</strong>
                <span>35% off retail</span>
                <small>5–9 kg / month</small>
              </div>

              <div className="tier-item">
                <strong>Tier 3</strong>
                <span>40% off retail</span>
                <small>10+ kg / month</small>
              </div>

              <label className="minimum-order">
                Minimum order (kg)
                <input type="number" value="1" readOnly />
              </label>

              <button
                className="admin-primary-button save-button"
                onClick={showComingSoon}
              >
                SAVE WHOLESALE INFO
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AdminProducts
