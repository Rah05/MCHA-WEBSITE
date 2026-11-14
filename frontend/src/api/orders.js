// Calls the order history route. Login token is saved in localStorage under 'token'.
export function getToken() {
  return localStorage.getItem('token')
}

export async function getMyOrders() {
  const res = await fetch('/api/orders', {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.error || `Could not load orders: ${res.status}`)
    error.status = res.status
    throw error
  }

  return data.orders
}