import { useState } from "react";
import { getCart, getSubtotal } from "../utils/cart";
import "./CheckoutPage.css";
import "./PaymentPage.css";

function getCheckoutDetails() {
try {
return JSON.parse(
sessionStorage.getItem("mcha_checkout") || "null"
);
} catch {
return null;
}
}

export default function PaymentPage() {
const [cart] = useState(getCart);
const [details] = useState(getCheckoutDetails);
const [method, setMethod] = useState("card");
const [accepted, setAccepted] = useState(false);
const [error, setError] = useState("");

const subtotal = getSubtotal(cart);
const shipping = cart.length ? 5 : 0;
const total = subtotal + shipping;

function handlePayment(e) {
e.preventDefault();
setError("");

if (!cart.length) {
setError("Your shopping cart is empty.");
return;
}

if (!details?.email || !details?.address) {
setError("Please complete your shipping information.");
return;
}

if (!accepted) {
setError("Please confirm your order details.");
return;
}

// TODO: Connect the approved payment provider
// and backend checkout API when available.

setError(
"Payment processing is not connected yet. " +
"No payment has been collected."
);
}

return (
<main className="mcha-checkout">

<header className="checkout-header">
<a href="/">M.CHA MATCHA</a>
<a href="/checkout">Back to Shipping</a>
</header>

<div className="checkout-steps">
<a href="/cart">1. Cart</a>
<a href="/checkout">2. Shipping</a>
<strong>3. Payment</strong>
</div>

<h1>Payment</h1>
<p>Review your order and payment method.</p>

{!cart.length || !details ? (
<section className="checkout-panel">
<h2>Checkout information required</h2>
<p>
Add products and complete your
shipping details before continuing.
</p>

<a href={cart.length ? "/checkout" : "/shop"}>
Continue
</a>
</section>
) : (
<div className="checkout-layout">

<form
className="checkout-panel"
onSubmit={handlePayment}
>
<h2>Shipping Information</h2>

<div className="payment-address">
<strong>
{details.firstName} {details.lastName}
</strong>

<p>{details.email}</p>
<p>{details.phone}</p>
<p>{details.address}</p>

{details.apartment && (
<p>{details.apartment}</p>
)}

<p>
{details.city}, {details.state} {details.zip}
</p>

<p>{details.country}</p>

<a href="/checkout">Edit Shipping Details</a>
</div>

<h2>Payment Method</h2>

<label className="payment-method">
<input
type="radio"
name="paymentMethod"
value="card"
checked={method === "card"}
onChange={e => setMethod(e.target.value)}
/>

<span>Credit or Debit Card</span>
</label>

<div className="payment-brands">
<span>VISA</span>
<span>Mastercard</span>
<span>AMEX</span>
</div>

<div className="payment-notice">
Card entry will be provided through
the secure payment provider once
integration is complete.
No card details are collected on
this preview.
</div>

<label className="payment-confirm">
<input
type="checkbox"
checked={accepted}
onChange={e => setAccepted(e.target.checked)}
/>

<span>
I have reviewed my order and
shipping information.
</span>
</label>

{error && (
<div
className="payment-error"
role="alert"
>
{error}
</div>
)}

<button
type="submit"
className="checkout-button"
>
Continue to Secure Payment
</button>

<p className="payment-secure">
Payment integration pending
</p>

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

</aside>

</div>
)}

</main>
);
}