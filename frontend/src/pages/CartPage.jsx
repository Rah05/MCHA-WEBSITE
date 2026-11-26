import { useState } from "react";
import {
getCart,
updateQuantity,
removeFromCart,
getSubtotal
} from "../utils/cart";

import "./CartPage.css";

export default function CartPage() {
const [cart, setCart] = useState(getCart);

const subtotal = getSubtotal(cart);
const shipping = cart.length > 0 ? 5 : 0;
const total = subtotal + shipping;

return (
<main className="mcha-cart">
<header className="mcha-cart-header">
<span>M.CHA MATCHA</span>
<a href="/shop">Continue Shopping</a>
</header>

<h1>Your Shopping Cart</h1>
<p>Review your items before checkout.</p>

<div className="mcha-cart-layout">
<section className="mcha-cart-items">

{cart.length === 0 && (
<div className="mcha-cart-empty">
<h2>Your cart is empty</h2>
<p>Discover your next favorite matcha.</p>
<a href="/shop">Browse Products</a>
</div>
)}

{cart.map(item => (
<article
className="mcha-cart-item"
key={item.id}
>
{item.image && (
<img
src={item.image}
alt={item.name}
/>
)}

<div className="mcha-cart-info">
<h3>{item.name}</h3>
<p>${Number(item.price).toFixed(2)}</p>

<div className="mcha-cart-quantity">
<button
aria-label="Decrease quantity"
disabled={item.quantity <= 1}
onClick={() =>
setCart(updateQuantity(
item.id,
item.quantity - 1
))
}
>
−
</button>

<span>{item.quantity}</span>

<button
aria-label="Increase quantity"
onClick={() =>
setCart(updateQuantity(
item.id,
item.quantity + 1
))
}
>
+
</button>
</div>

<button
className="mcha-cart-remove"
onClick={() =>
setCart(removeFromCart(item.id))
}
>
Remove
</button>
</div>

<strong>
${(item.price * item.quantity).toFixed(2)}
</strong>
</article>
))}
</section>

<aside className="mcha-cart-summary">
<h2>Order Summary</h2>

<div className="mcha-cart-summary-row">
<span>Subtotal</span>
<span>${subtotal.toFixed(2)}</span>
</div>

<div className="mcha-cart-summary-row">
<span>Estimated Shipping</span>
<span>${shipping.toFixed(2)}</span>
</div>

<hr />

<div className="mcha-cart-summary-row">
<strong>Estimated Total</strong>
<strong>${total.toFixed(2)}</strong>
</div>

<button
className="mcha-cart-checkout"
disabled={cart.length === 0}
onClick={() =>
window.location.href = "/checkout"
}
>
Proceed to Checkout
</button>

<small>
Taxes and final shipping calculated
at checkout.
</small>
</aside>
</div>
</main>
);
}