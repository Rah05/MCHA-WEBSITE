
// Calls the order history route. Login token is saved in localStorage under 'token'.

// Get the login token
export function getToken() {
  return localStorage.getItem('token')
}

// Get all orders for the logged-in customer
export async function getMyOrders() {
  const res = await fetch('/api/orders', {
    headers: { Authorization: `Bearer ${getToken()}` },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(
      data.error || `Could not load orders: ${res.status}`
    )
    error.status = res.status
    throw error
  }

  return data.orders
}

// Get details for one order
export async function getOrderById(orderId) {
  const res = await fetch(`/api/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(
      data.error || `Could not load order details: ${res.status}`
    )
    error.status = res.status
    throw error
  }

  return data.order
}
