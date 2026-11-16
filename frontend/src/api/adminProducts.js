// Calls the admin product routes (SCRUM-63, SCRUM-64). All of them need an admin login.
// The login token is saved in localStorage under 'token' (see pages/Login.jsx).

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${localStorage.getItem('token')}`, ...extra }
}

// Throws an Error with the server's message and the HTTP status (so pages can react to 401/403).
async function readResponse(res, fallbackMessage) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || `${fallbackMessage}: ${res.status}`)
    error.status = res.status
    throw error
  }
  return data
}

// Every product, including hidden ones and wholesale prices
export async function getAdminProducts() {
  const res = await fetch('/api/admin/products', { headers: authHeaders() })
  const data = await readResponse(res, 'Could not load products')
  return data.products
}

// Add a product. `product` needs at least { name, category, price }.
export async function createProduct(product) {
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(product),
  })
  const data = await readResponse(res, 'Could not add the product')
  return data.product
}

// Edit a product. Send only the fields that changed.
export async function updateProduct(id, changes) {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(changes),
  })
  const data = await readResponse(res, 'Could not save the product')
  return data.product
}
