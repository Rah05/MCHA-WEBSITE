import { useState } from "react";
import { getCart, getSubtotal } from "../utils/cart";
import "./CheckoutPage.css";

export default function CheckoutPage() {
const [cart] = useState(getCart);

const [details, setDetails] = useState({
firstName: "",
lastName: "",
email: "",
phone: "",
address: "",
apartment: "",
city: "",
state: "",
zip: "",
country: "United States"
});

const subtotal = getSubtotal(cart);
const shipping = cart.length ? 5 : 0;
const total = subtotal + shipping;

function handleChange(e) {
const { name, value } = e.target;

setDetails(previous => ({
...previous,
[name]: value
}));
}

function handleSubmit(e) {
e.preventDefault();

if (!cart.length) return;

sessionStorage.setItem(
"mcha_checkout",
JSON.stringify(details)
);

window.location.href = "/payment";
}

function field(label, name, type = "text", required = true) {
return (
<label>
{label}
<input
name={name}
type={type}
value={details[name]}
onChange={handleChange}
required={required}
/>
</label>
);
}

return (
<main className="mcha-checkout">

<header className="checkout-header">
<a href="/">M.CHA MATCHA</a>
<a href="/cart">Back to Cart</a>
</header>

<div className="checkout-steps">
<a href="/cart">1. Cart</a>
<strong>2. Shipping</strong>
<span>3. Payment</span>
</div>

<h1>Checkout</h1>
<p>Enter your contact and shipping information.</p>

{!cart.length ? (
<section className="checkout-panel">
<h2>Your cart is empty</h2>
<a href="/shop">Continue Shopping</a>
</section>
) : (
<div className="checkout-layout">

<form
className="checkout-panel"
onSubmit={handleSubmit}
>
<h2>Contact Information</h2>

{field("Email Address", "email", "email")}
{field("Phone Number", "phone", "tel")}

<h2>Shipping Address</h2>

<div className="checkout-grid">
{field("First Name", "firstName")}
{field("Last Name", "lastName")}
</div>

{field("Street Address", "address")}

{field(
"Apartment / Suite (Optional)",
"apartment",
"text",
false
)}

<div className="checkout-grid">
{field("City", "city")}
{field("State", "state")}
</div>

<div className="checkout-grid">
{field("ZIP Code", "zip")}

<label>
Country
<select
name="country"
value={details.country}
onChange={handleChange}
>
<option>United States</option>
</select>
</label>
</div>

<button
type="submit"
className="checkout-button"
>
Continue to Payment
</button>

</form>

<aside className="checkout-panel checkout-summary">
<h2>Order Summary</h2>

{cart.map(item => (
<div
className="checkout-row"
key={item.id}
>
<span>
{item.name} × {item.quantity}
</span>

<span>
${(item.price * item.quantity).toFixed(2)}
</span>
</div>
))}

<hr />

<div className="checkout-row">
<span>Subtotal</span>
<span>${subtotal.toFixed(2)}</span>
</div>

<div className="checkout-row">
<span>Estimated Shipping</span>
<span>${shipping.toFixed(2)}</span>
</div>

<hr />

<div className="checkout-row">
<strong>Estimated Total</strong>
<strong>${total.toFixed(2)}</strong>
</div>

<small>
Taxes and final charges will be
confirmed by the checkout service.
</small>

</aside>

</div>
)}

</main>
);
}
