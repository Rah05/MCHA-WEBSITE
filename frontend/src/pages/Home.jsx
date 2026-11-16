
import Header from '../components/Header'

function Home() {
  return (
    <>
      <Header />

      <main className="home">
        <h1>Matcha, rooted in tradition.</h1>

        <p>
          Handcrafted matcha and hojicha, straight from Kyoto to Sacramento.
        </p>

        <div className="hero-buttons">
          <a href="/shop">SHOP M.CHA</a>
          <a href="/schedule">FIND A POP-UP</a>
        </div>
      </main>

      <section className="today-banner">
        <div className="today-content">
          <p className="today-label">FIND YOUR DAILY RITUAL</p>

          <h2>WHERE WE ARE TODAY</h2>

          <h3>Find our pop-up!</h3>

          <p className="today-location">
            Midtown Farmers Market
          </p>

          <p>
            Sacramento, CA
          </p>

          <p>
            Today's Hours: 9:00 AM – 1:00 PM
          </p>

          <div className="today-buttons">
            <a href="/schedule">VIEW SCHEDULE</a>
            <a href="/schedule">GET DIRECTIONS</a>
          </div>
        </div>
      </section>
      <section className="products-section">
        <h2>FEATURED PRODUCTS</h2>
        <p>Discover our matcha favorites.</p>
        <div className="products-grid">
          <div className="product-card">
            <div className="product-image">M.Blend</div>
            <h3>M. Blend 30g</h3>
            <p>$30</p>
            <button>ADD TO CART</button>
          </div>

          <div className="product-card">
            <div className="product-image">Matcha Latte Mix</div>
            <h3>Matcha Latte Mix</h3>
            <p>$24</p>
            <button>ADD TO CART</button>
          </div>

          <div className="product-card">
            <div className="product-image">Hjicha Powder</div>
            <h3>Hojicha Powder</h3>
            <p>$26</p>
            <button>ADD TO CART</button>
          </div>

          <div className="product-card">
            <div className="product-image">Chawan Bowl</div>
            <h3>Chawan Bowl</h3>
            <p>$42</p>
            <button>ADD TO CART</button>
          </div>
        </div>
      </section>

      {/* M.CHA Rewards Section */}
            {/* =========================
          M.CHA Rewards Section
      ========================= */}
      <section className="rewards-section">

        {/* Rewards section heading */}
        <p>MAKE EVERY CUP COUNT</p>
        <h2>M.CHA Rewards</h2>

        {/* Short description of the rewards program */}
        <p>
          Enjoy your favorite matcha and earn rewards along the way.
        </p>

        {/* Link to the rewards page */}
        <a href="/rewards">LEARN MORE</a>

      </section>

            {/* =========================
          Customer Reviews Section
      ========================= */}
      <section className="reviews-section">

        {/* Section heading */}
        <p>WHAT PEOPLE SAY</p>
        <h2>Customer Reviews</h2>

        {/* Review cards */}
        <div className="reviews-grid">

          {/* Review 1 */}
          <div className="review-card">
            <p>"The matcha is so smooth and delicious!"</p>
            <h3>— Customer</h3>
          </div>

          {/* Review 2 */}
          <div className="review-card">
            <p>"I love the balance of traditional and modern flavors."</p>
            <h3>— Customer</h3>
          </div>

          {/* Review 3 */}
          <div className="review-card">
            <p>"My favorite matcha spot in Sacramento!"</p>
            <h3>— Customer</h3>
          </div>

        </div>
      </section>

            {/* =========================
          Upcoming Pop-Ups Section
      ========================= */}
      <section className="popups-section">

        {/* Section heading */}
        <p>COME FIND US</p>
        <h2>Upcoming Pop-Ups</h2>

        {/* Pop-up event list */}
        <div className="popups-list">

          {/* Pop-up event 1 */}
          <div className="popup-card">
            <p className="popup-date">OCT 10</p>
            <h3>Midtown Farmers Market</h3>
            <p>Sacramento, CA</p>
          </div>

          {/* Pop-up event 2 */}
          <div className="popup-card">
            <p className="popup-date">OCT 18</p>
            <h3>Granite Bay Market</h3>
            <p>Granite Bay, CA</p>
          </div>

          {/* Pop-up event 3 */}
          <div className="popup-card">
            <p className="popup-date">OCT 24</p>
            <h3>Davis Community Market</h3>
            <p>Davis, CA</p>
          </div>

        </div>

        {/* Link to the full schedule */}
        <a href="/schedule" className="popup-schedule-button">
          VIEW FULL SCHEDULE
        </a>

      </section>

            {/* =========================
          Footer Section
      ========================= */}
      <footer className="footer">

        {/* Brand information */}
        <div className="footer-brand">
          <h2>M.CHA</h2>
          <p>Matcha, rooted in tradition.</p>
          <p>From Kyoto to Sacramento.</p>
        </div>

        {/* Website navigation links */}
        <div className="footer-links">
          <a href="/shop">SHOP</a>
          <a href="/wholesale">WHOLESALE</a>
          <a href="/schedule">SCHEDULE</a>
          <a href="/events">EVENTS</a>
          <a href="/about">ABOUT</a>
        </div>

        {/* Contact information */}
        <div className="footer-contact">
          <h3>CONTACT</h3>
          <a href="/contact">GET IN TOUCH</a>
        </div>

        {/* Copyright information */}
        <div className="footer-bottom">
          <p>© 2026 M.CHA. All rights reserved.</p>
        </div>

      </footer>
    </>
  )
}

export default Home
