
import { useState } from 'react';
import './AdminProducts.css';

// Temporary Figma sample data.
// Replace with backend API data during integration.
const initialProducts = [
{
id: 1,
name: 'M. Blend 30g',
category: 'Matcha',
price: 30,
wholesalePrice: 21,
stock: 42,
stockLabel: '',
available: true
},
{
id: 2,
name: 'Ceremonial Uji 20g',
category: 'Matcha',
price: 38,
wholesalePrice: 27.5,
stock: 6,
stockLabel: '',
available: true
},
{
id: 3,
name: 'Hojicha 50g',
category: 'Roasted tea',
price: 18,
wholesalePrice: 12,
stock: 31,
stockLabel: '',
available: true
},
{
id: 4,
name: 'Chawan bowl — Kyoto glaze',
category: 'Teaware',
price: 64,
wholesalePrice: 44,
stock: 4,
stockLabel: '',
available: true
},
{
id: 5,
name: 'Bamboo chasen whisk',
category: 'Teaware',
price: 24,
wholesalePrice: 15,
stock: 18,
stockLabel: '',
available: true
},
{
id: 6,
name: 'Iced Matcha Latte',
category: 'Drinks (pop-up)',
price: 7,
wholesalePrice: null,
stock: 0,
stockLabel: 'Made to order',
available: true
},
{
id: 7,
name: 'Yuzu Matcha Soda',
category: 'Drinks (pop-up)',
price: 8,
wholesalePrice: null,
stock: 0,
stockLabel: 'Seasonal',
available: false
}
];

const emptyProduct = {
name: '',
category: 'Matcha',
price: '',
wholesalePrice: '',
stock: '',
stockLabel: '',
available: true
};

const categories = [
'Matcha',
'Roasted tea',
'Teaware',
'Drinks (pop-up)'
];

const money = value =>
value === null || value === ''
? '—'
: `$${Number(value).toFixed(2)}`;

function AdminProducts() {
const [products, setProducts] = useState(initialProducts);
const [search, setSearch] = useState('');
const [filter, setFilter] = useState('All');
const [editingId, setEditingId] = useState(null);
const [showForm, setShowForm] = useState(false);
const [form, setForm] = useState(emptyProduct);
const [error, setError] = useState('');

const [minimumOrder, setMinimumOrder] = useState('1');
const [wholesaleMessage, setWholesaleMessage] = useState('');

const filteredProducts = products.filter(product => {
const matchesSearch =
product.name.toLowerCase().includes(search.toLowerCase()) ||
product.category.toLowerCase().includes(search.toLowerCase());

const matchesCategory =
filter === 'All' ||
(filter === 'Matcha & tea' &&
['Matcha', 'Roasted tea'].includes(product.category)) ||
(filter === 'Teaware' && product.category === 'Teaware') ||
(filter === 'Drinks (pop-up)' &&
product.category === 'Drinks (pop-up)');

return matchesSearch && matchesCategory;
});

const activeCount = products.filter(p => p.available).length;
const lowStockCount = products.filter(
p => p.available && !p.stockLabel && p.stock > 0 && p.stock < 10
).length;
const hiddenCount = products.filter(
p => !p.available || (!p.stockLabel && p.stock === 0)
).length;

function openAddForm() {
setEditingId(null);
setForm({ ...emptyProduct });
setError('');
setShowForm(true);
}

function openEditForm(product) {
setEditingId(product.id);
setForm({
name: product.name,
category: product.category,
price: String(product.price),
wholesalePrice:
product.wholesalePrice === null
? ''
: String(product.wholesalePrice),
stock: String(product.stock),
stockLabel: product.stockLabel || '',
available: product.available
});
setError('');
setShowForm(true);
}

function updateForm(field, value) {
setForm(previous => ({
...previous,
[field]: value
}));
}

function saveProduct(event) {
event.preventDefault();

const name = form.name.trim();
const price = Number(form.price);
const stock = Number(form.stock);
const wholesalePrice =
form.wholesalePrice === ''
? null
: Number(form.wholesalePrice);

if (!name) {
setError('Please enter a product name.');
return;
}

if (
form.price === '' ||
!Number.isFinite(price) ||
price < 0
) {
setError('Enter a valid retail price.');
return;
}

if (
form.stock === '' ||
!Number.isInteger(stock) ||
stock < 0
) {
setError('Stock must be a non-negative whole number.');
return;
}

if (
wholesalePrice !== null &&
(!Number.isFinite(wholesalePrice) || wholesalePrice < 0)
) {
setError('Enter a valid wholesale price.');
return;
}

const productData = {
name,
category: form.category,
price,
wholesalePrice,
stock,
stockLabel: form.stockLabel.trim(),
available: form.available
};

if (editingId !== null) {
setProducts(previous =>
previous.map(product =>
product.id === editingId
? { ...product, ...productData }
: product
)
);
} else {
setProducts(previous => [
...previous,
{
id: crypto.randomUUID(),
...productData
}
]);
}

setShowForm(false);
setEditingId(null);
setError('');
}

function deleteProduct(id) {
const product = products.find(p => p.id === id);

if (!product) return;

if (
window.confirm(
`Delete "${product.name}"? This cannot be undone in this session.`
)
) {
setProducts(previous =>
previous.filter(p => p.id !== id)
);
setShowForm(false);
}
}

function toggleAvailability(id) {
setProducts(previous =>
previous.map(product =>
product.id === id
? { ...product, available: !product.available }
: product
)
);
}

function saveWholesaleInfo(event) {
event.preventDefault();

const value = Number(minimumOrder);

if (!Number.isFinite(value) || value <= 0) {
setWholesaleMessage('Enter a minimum order greater than zero.');
return;
}

setWholesaleMessage('Saved locally for this session.');
}

function getStockLabel(product) {
if (product.stockLabel) return product.stockLabel;
if (product.stock === 0) return 'Sold out';
return `${product.stock} in stock`;
}

return (
<div className="mcha-admin">
<main className="mcha-content">
<div className="mcha-heading">
<div>
<h1>Products & Pricing</h1>
<p>
Manage what customers see in the shop,
at pop-ups, and on wholesale price sheets.
</p>
</div>

<div className="mcha-heading-actions">
<input
type="search"
aria-label="Search products"
placeholder="Search products..."
value={search}
onChange={event => setSearch(event.target.value)}
/>
<button className="mcha-primary" onClick={openAddForm}>
+ ADD PRODUCT
</button>
</div>
</div>

<section className="mcha-stats">
<div className="mcha-stat">
<span>ACTIVE PRODUCTS</span>
<strong>{activeCount}</strong>
<small>Visible in shop</small>
</div>

<div className="mcha-stat">
<span>LOW STOCK</span>
<strong>{lowStockCount}</strong>
<small>Reorder soon</small>
</div>

<div className="mcha-stat">
<span>HIDDEN / SOLD OUT</span>
<strong>{hiddenCount}</strong>
<small>Not shown to customers</small>
</div>

<div className="mcha-stat">
<span>WHOLESALE ACCOUNTS</span>
<strong>6</strong>
<small>2 pending review · Demo</small>
</div>
</section>

<section className="mcha-panel mcha-catalog">
<div className="mcha-catalog-toolbar">
<div className="mcha-filters">
{['All', 'Matcha & tea', 'Teaware', 'Drinks (pop-up)'].map(
category => (
<button
key={category}
className={filter === category ? 'selected' : ''}
onClick={() => setFilter(category)}
>
{category}
</button>
)
)}
</div>
<small>Demo changes are local until API integration</small>
</div>

<div className="mcha-table-scroll">
<table className="mcha-table">
<thead>
<tr>
<th>PRODUCT</th>
<th>CATEGORY</th>
<th>RETAIL PRICE</th>
<th>WHOLESALE</th>
<th>STOCK</th>
<th>AVAILABILITY</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
{filteredProducts.map(product => (
<tr key={product.id}>
<td>
<div className="mcha-product-name">
<span className="mcha-product-swatch" />
<strong>{product.name}</strong>
</div>
</td>
<td>{product.category}</td>
<td>{money(product.price)}</td>
<td>{money(product.wholesalePrice)}</td>
<td>
<span className={
product.stock > 0 && product.stock < 10
? 'mcha-stock low'
: 'mcha-stock'
}>
{getStockLabel(product)}
</span>
</td>
<td>
<label className="mcha-availability">
<input
type="checkbox"
checked={product.available}
onChange={() => toggleAvailability(product.id)}
aria-label={`Availability for ${product.name}`}
/>
<span>
{product.available
? product.category === 'Drinks (pop-up)'
? 'Pop-ups only'
: 'Available'
: 'Hidden'}
</span>
</label>
</td>
<td>
<div className="mcha-row-actions">
<button onClick={() => openEditForm(product)}>
Edit
</button>
<button
className="mcha-delete"
onClick={() => deleteProduct(product.id)}
>
Delete
</button>
</div>
</td>
</tr>
))}
</tbody>
</table>

{filteredProducts.length === 0 && (
<p className="mcha-empty">No matching products found.</p>
)}
</div>
</section>

<div className="mcha-bottom-grid">
<section className="mcha-panel mcha-wholesale">
<div className="mcha-section-heading">
<div>
<h2>Wholesale information</h2>
<p>Cafés and shops buying M.CHA in bulk</p>
</div>
<span className="mcha-demo-label">DEMO DATA</span>
</div>

<div className="mcha-table-scroll">
<table className="mcha-table">
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
{[
['Kōyō Café', 'mina@koyocafe.com', 'Tier 2', '2 kg', 'Active'],
['Midtown Bakehouse', 'orders@midtownbake.co', 'Tier 1', '1 kg', 'Active'],
['Leaf & Bean Co.', 'hello@leafbean.com', '—', '1 kg', 'Pending'],
['Sora Tea Bar', 'sora.teabar@gmail.com', '—', '2 kg', 'Pending']
].map(account => (
<tr key={account[0]}>
{account.slice(0, 4).map((value, index) => (
<td key={index}>{value}</td>
))}
<td>
<span className={
account[4] === 'Active'
? 'mcha-stock'
: 'mcha-stock low'
}>
{account[4]}
</span>
</td>
</tr>
))}
</tbody>
</table>
</div>
</section>

<section className="mcha-panel mcha-tiers">
<h2>Wholesale price tiers</h2>

<div className="mcha-tier">
<div>
<strong>Tier 1</strong>
<small>1–4 kg / month</small>
</div>
<span>30% off retail</span>
</div>

<div className="mcha-tier">
<div>
<strong>Tier 2</strong>
<small>5–9 kg / month</small>
</div>
<span>35% off retail</span>
</div>

<div className="mcha-tier">
<div>
<strong>Tier 3</strong>
<small>10+ kg / month</small>
</div>
<span>40% off retail</span>
</div>

<form onSubmit={saveWholesaleInfo}>
<label htmlFor="minimum-order">
Minimum order (kg)
</label>
<input
id="minimum-order"
type="number"
min="0.01"
step="0.01"
value={minimumOrder}
onChange={event => {
setMinimumOrder(event.target.value);
setWholesaleMessage('');
}}
/>
<button className="mcha-primary" type="submit">
SAVE WHOLESALE INFO
</button>
{wholesaleMessage && (
<p role="status">{wholesaleMessage}</p>
)}
</form>
</section>
</div>
</main>

<aside className="mcha-sidebar">
<div className="mcha-brand">
M.CHA <span>ADMIN</span>
</div>

<nav aria-label="Admin navigation">
{[
'Dashboard',
'Products & Pricing',
'Wholesale',
'Pop-ups & Calendar',
'Event Requests',
'Orders & Inquiries',
'Employee Schedules',
'Visitor Records'
].map(item => (
<div
key={item}
className={
item === 'Products & Pricing'
? 'mcha-nav-item active'
: 'mcha-nav-item'
}
aria-current={
item === 'Products & Pricing' ? 'page' : undefined
}
>
{item}
</div>
))}
</nav>

<div className="mcha-sidebar-footer">
<span className="mcha-avatar">NR</span>
<div>
<strong>Admin demo</strong>
<small>Preview only</small>
</div>
</div>
</aside>

{showForm && (
<div className="mcha-modal-backdrop">
<div
className="mcha-modal"
role="dialog"
aria-modal="true"
aria-labelledby="product-form-title"
>
<div className="mcha-modal-header">
<div>
<small>PRODUCT MANAGEMENT</small>
<h2 id="product-form-title">
{editingId !== null ? 'Edit product' : 'Add new product'}
</h2>
</div>
<button
className="mcha-close"
onClick={() => setShowForm(false)}
aria-label="Close product form"
>
×
</button>
</div>

<form onSubmit={saveProduct} className="mcha-product-form">
<label>
Product name
<input
required
value={form.name}
onChange={event =>
updateForm('name', event.target.value)
}
placeholder="Product name"
/>
</label>

<label>
Category
<select
value={form.category}
onChange={event =>
updateForm('category', event.target.value)
}
>
{categories.map(category => (
<option key={category} value={category}>
{category}
</option>
))}
</select>
</label>

<div className="mcha-form-grid">
<label>
Retail price ($)
<input
required
type="number"
min="0"
step="0.01"
value={form.price}
onChange={event =>
updateForm('price', event.target.value)
}
/>
</label>

<label>
Wholesale price ($)
<input
type="number"
min="0"
step="0.01"
value={form.wholesalePrice}
onChange={event =>
updateForm('wholesalePrice', event.target.value)
}
/>
</label>
</div>

<div className="mcha-form-grid">
<label>
Stock quantity
<input
required
type="number"
min="0"
step="1"
value={form.stock}
onChange={event =>
updateForm('stock', event.target.value)
}
/>
</label>

<label>
Special stock label
<input
value={form.stockLabel}
onChange={event =>
updateForm('stockLabel', event.target.value)
}
placeholder="e.g. Made to order"
/>
</label>
</div>

<label className="mcha-form-checkbox">
<input
type="checkbox"
checked={form.available}
onChange={event =>
updateForm('available', event.target.checked)
}
/>
Available to customers
</label>

{error && (
<p className="mcha-form-error" role="alert">
{error}
</p>
)}

<div className="mcha-form-actions">
<button
type="button"
className="mcha-secondary"
onClick={() => setShowForm(false)}
>
CANCEL
</button>
<button type="submit" className="mcha-primary">
{editingId !== null ? 'SAVE CHANGES' : 'ADD PRODUCT'}
</button>
</div>
</form>
</div>
</div>
)}
</div>
);
}

export default AdminProducts;
