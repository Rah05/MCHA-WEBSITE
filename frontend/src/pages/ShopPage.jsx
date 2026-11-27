import { useMemo, useState } from "react";
import "./Shop.css";

const sampleProducts = [
{ id: 1, name: "Classic Matcha Latte", category: "Matcha", price: 6.5, stock: 24, description: "Smooth ceremonial-style matcha with creamy milk.", emoji: "🍵" },
{ id: 2, name: "Strawberry Matcha", category: "Matcha", price: 7.5, stock: 12, description: "Matcha layered with sweet strawberry puree.", emoji: "🍓" },
{ id: 3, name: "Vanilla Matcha", category: "Matcha", price: 7, stock: 4, description: "Rich matcha balanced with vanilla.", emoji: "🍵" },
{ id: 4, name: "Iced Hojicha Latte", category: "Tea", price: 6.75, stock: 15, description: "Roasted Japanese green tea with milk.", emoji: "🧋" },
{ id: 5, name: "Mango Matcha", category: "Matcha", price: 7.75, stock: 0, description: "Refreshing matcha with tropical mango.", emoji: "🥭" },
{ id: 6, name: "Matcha Cookie", category: "Treats", price: 3.5, stock: 9, description: "Soft baked cookie with matcha flavor.", emoji: "🍪" },
{ id: 7, name: "Brown Sugar Milk Tea", category: "Tea", price: 6.5, stock: 3, description: "Creamy milk tea with brown sugar.", emoji: "🧋" },
{ id: 8, name: "Matcha Cheesecake", category: "Treats", price: 5.5, stock: 0, description: "Creamy cheesecake with a matcha finish.", emoji: "🍰" }
];

// Demo data only. Replace with products from the backend team's API.
export default function Shop({ products = sampleProducts }) {
const [search, setSearch] = useState("");
const [category, setCategory] = useState("All");
const [availability, setAvailability] = useState("all");
const [sort, setSort] = useState("default");

const categories = useMemo(
() => ["All", ...new Set(products.map(p => p.category))],
[products]
);

const filteredProducts = useMemo(() => {
let results = products.filter(product => {
const query = search.trim().toLowerCase();
const matchesSearch =
product.name.toLowerCase().includes(query) ||
product.description.toLowerCase().includes(query) ||
product.category.toLowerCase().includes(query);

const matchesCategory =
category === "All" || product.category === category;

const matchesAvailability =
availability === "all" ||
(availability === "in-stock" && product.stock > 0) ||
(availability === "sold-out" && product.stock === 0);

return matchesSearch && matchesCategory && matchesAvailability;
});

if (sort === "price-low") {
results.sort((a, b) => a.price - b.price);
} else if (sort === "price-high") {
results.sort((a, b) => b.price - a.price);
} else if (sort === "name") {
results.sort((a, b) => a.name.localeCompare(b.name));
}

return results;
}, [products, search, category, availability, sort]);

const resetFilters = () => {
setSearch("");
setCategory("All");
setAvailability("all");
setSort("default");
};

return (
<main className="mcha-shop">
<header className="mcha-shop__header">
<div className="mcha-shop__nav">
<a href="/" className="mcha-shop__logo">M.CHA</a>
<span>FRESH MATCHA • MADE WITH LOVE</span>
</div>

<div className="mcha-shop__hero">
<span className="mcha-shop__eyebrow">WELCOME TO OUR MENU</span>
<h1>Find your perfect <em>matcha.</em></h1>
<p>
Explore our drinks and treats, discover your favorites,
and see what's currently available.
</p>
</div>
</header>

<section className="mcha-shop__content" aria-label="Browse products">
<div className="mcha-shop__toolbar">
<label className="mcha-shop__search">
<span>Search products</span>
<input
type="search"
placeholder="Search matcha, drinks, treats..."
value={search}
onChange={e => setSearch(e.target.value)}
/>
</label>

<label className="mcha-shop__select">
<span>Availability</span>
<select
value={availability}
onChange={e => setAvailability(e.target.value)}
>
<option value="all">All products</option>
<option value="in-stock">Available now</option>
<option value="sold-out">Sold out</option>
</select>
</label>

<label className="mcha-shop__select">
<span>Sort by</span>
<select value={sort} onChange={e => setSort(e.target.value)}>
<option value="default">Featured</option>
<option value="price-low">Price: low to high</option>
<option value="price-high">Price: high to low</option>
<option value="name">Name: A to Z</option>
</select>
</label>
</div>

<div className="mcha-shop__categories" aria-label="Product categories">
{categories.map(item => (
<button
key={item}
type="button"
className={category === item ? "active" : ""}
aria-pressed={category === item}
onClick={() => setCategory(item)}
>
{item}
</button>
))}
</div>

<div className="mcha-shop__results">
<p>
Showing <strong>{filteredProducts.length}</strong> of{" "}
<strong>{products.length}</strong> products
</p>
<button type="button" onClick={resetFilters}>
Clear filters
</button>
</div>

{filteredProducts.length === 0 ? (
<div className="mcha-shop__empty">
<h2>No products found</h2>
<p>Try another search or reset your filters.</p>
<button type="button" onClick={resetFilters}>
Show all products
</button>
</div>
) : (
<div className="mcha-shop__grid">
{filteredProducts.map(product => {
const soldOut = product.stock <= 0;
const lowStock = product.stock > 0 && product.stock <= 5;

return (
<article className="mcha-shop__card" key={product.id}>
<div className="mcha-shop__image">
<span aria-hidden="true">{product.emoji || "🍵"}</span>
<div
className={`mcha-shop__badge ${
soldOut ? "sold-out" : lowStock ? "low-stock" : "in-stock"
}`}
>
{soldOut
? "Sold out"
: lowStock
? "Low stock"
: "In stock"}
</div>
</div>

<div className="mcha-shop__card-body">
<span className="mcha-shop__category">
{product.category}
</span>
<h2>{product.name}</h2>
<p>{product.description}</p>

<div className="mcha-shop__card-bottom">
<strong>${Number(product.price).toFixed(2)}</strong>
<span className={soldOut ? "unavailable" : "available"}>
{soldOut
? "Currently unavailable"
: lowStock
? `Only ${product.stock} left`
: "Available"}
</span>
</div>
</div>
</article>
);
})}
</div>
)}
</section>

<footer className="mcha-shop__footer">
M.CHA • FOLLOW THE MATCHA
</footer>
</main>
);
}
