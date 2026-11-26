const CART_KEY = "mcha_cart";

export function getCart() {
try {
const items = JSON.parse(
sessionStorage.getItem(CART_KEY) || "[]"
);
return Array.isArray(items) ? items : [];
} catch {
return [];
}
}

export function saveCart(items) {
sessionStorage.setItem(
CART_KEY,
JSON.stringify(items)
);
}

export function addToCart(product) {
const cart = getCart();
const existing = cart.find(
item => item.id === product.id
);

if (existing) {
existing.quantity += 1;
} else {
cart.push({ ...product, quantity: 1 });
}

saveCart(cart);
return cart;
}

export function updateQuantity(id, quantity) {
const cart = getCart().map(item =>
item.id === id
? { ...item, quantity: Math.max(1, quantity) }
: item
);

saveCart(cart);
return cart;
}

export function removeFromCart(id) {
const cart = getCart().filter(
item => item.id !== id
);

saveCart(cart);
return cart;
}

export function clearCart() {
saveCart([]);
}

export function getSubtotal(cart) {
return cart.reduce(
(total, item) =>
total + Number(item.price) * item.quantity,
0
);
}