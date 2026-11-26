
import { useState } from 'react'
import Header from '../components/Header'
import { addToCart, getCart } from '../utils/cart'

const products = [
{ id: 'm-blend', name: 'M. Blend 30g', price: 30 },
{ id: 'latte-mix', name: 'Matcha Latte Mix', price: 24 },
{ id: 'hojicha', name: 'Hojicha Powder', price: 26 },
{ id: 'chawan', name: 'Chawan Bowl', price: 42 }
]

function Home() {
const [cart, setCart] = useState(getCart)
const [message, setMessage] = useState('')

const count = cart.reduce(
(total, item) => total + item.quantity, 0
)

function handleAdd(product) {
setCart(addToCart(product))
setMessage(`${product.name} added to cart.`)
}

return (
<>
<Header />

<main className="home">
<h1>Matcha, rooted in tradition.</h1>

<p>
Handcrafted matcha and hojicha,
straight from Kyoto to Sacramento.
</p>

<div className="hero-buttons">
<a href="/shop">SHOP M.CHA</a>
<a href="/schedule">FIND A POP-UP</a>
</div>
</main>

<section className="today-banner">
<div className="today-content">
<p className="today-label">
FIND YOUR DAILY RITUAL
</p>

<h2>WHERE WE ARE TODAY</h2>
<h3>Find our pop-up!</h3>

<p className="today-location">
Midtown Farmers Market
</p>

<p>Sacramento, CA</p>
<p>Today's Hours: 9:00 AM – 1:00 PM</p>

<div className="today-buttons">
<a href="/schedule">VIEW SCHEDULE</a>
<a href="/schedule">GET DIRECTIONS</a>
</div>
</div>
</section>

<section
className="products-section"
id="products"
>
<h2>FEATURED PRODUCTS</h2>
<p>Discover our matcha favorites.</p>

<div style={{ margin: '20px 0' }}>
<a
href="/cart"
style={{
color: '#345443',
fontWeight: 'bold'
}}
>
VIEW CART ({count})
</a>

<p role="status">{message}</p>
</div>

<div className="products-grid">
{products.map(product => (
<div
className="product-card"
key={product.id}
>
<div className="product-image">
{product.name}
</div>

<h3>{product.name}</h3>
<p>${product.price}</p>

<button
onClick={() => handleAdd(product)}
>
ADD TO CART
</button>
</div>
))}
</div>
</section>

<section className="rewards-section">
<p>MAKE EVERY CUP COUNT</p>
<h2>M.CHA Rewards</h2>

<p>
Enjoy your favorite matcha and earn
rewards along the way.
</p>

<a href="/rewards">LEARN MORE</a>
</section>

<section className="reviews-section">
<p>WHAT PEOPLE SAY</p>
<h2>Customer Reviews</h2>

<div className="reviews-grid">
<div className="review-card">
<p>
"The matcha is so smooth and delicious!"
</p>
<h3>— Customer</h3>
</div>

<div className="review-card">
<p>
"I love the balance of traditional
and modern flavors."
</p>
<h3>— Customer</h3>
</div>

<div className="review-card">
<p>
"My favorite matcha spot in Sacramento!"
</p>
<h3>— Customer</h3>
</div>
</div>
</section>

<section className="popups-section">
<p>COME FIND US</p>
<h2>Upcoming Pop-Ups</h2>

<div className="popups-list">
<div className="popup-card">
<p className="popup-date">OCT 10</p>
<h3>Midtown Farmers Market</h3>
<p>Sacramento, CA</p>
</div>

<div className="popup-card">
<p className="popup-date">OCT 18</p>
<h3>Granite Bay Market</h3>
<p>Granite Bay, CA</p>
</div>

<div className="popup-card">
<p className="popup-date">OCT 24</p>
<h3>Davis Community Market</h3>
<p>Davis, CA</p>
</div>
</div>

<a
href="/schedule"
className="popup-schedule-button"
>
VIEW FULL SCHEDULE
</a>
</section>

<footer className="footer">
<div className="footer-brand">
<h2>M.CHA</h2>
<p>Matcha, rooted in tradition.</p>
<p>From Kyoto to Sacramento.</p>
</div>

<div className="footer-links">
<a href="/shop">SHOP</a>
<a href="/wholesale">WHOLESALE</a>
<a href="/schedule">SCHEDULE</a>
<a href="/events">EVENTS</a>
<a href="/about">ABOUT</a>
</div>

<div className="footer-contact">
<h3>CONTACT</h3>
<a href="/contact">GET IN TOUCH</a>
</div>

<div className="footer-bottom">
<p>© 2026 M.CHA. All rights reserved.</p>
</div>
</footer>
</>
)
}

export default Home
