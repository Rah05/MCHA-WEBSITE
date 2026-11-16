
// Calls the order history route. Login token is saved in localStorage under 'token'.

// Get the login token
export function getToken() {
  return localStorage.getItem('token')
}

// Shared by both calls below: sends the login token, and turns a non-2xx reply
// into an Error carrying the server's message and status.
//
// A 401 means the server no longer accepts this login, because it expired or because
// a password reset signed the user out on every device (SCRUM-101). The saved token
// is useless from then on, so it's removed here. Otherwise the site would keep
// treating the user as signed in (the header would still say LOG OUT) until they
// logged out by hand. The pages still get the error and show their "please log in"
// message as before.
async function getJson(url, fallbackMessage) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token')
    }

    const error = new Error(data.error || `${fallbackMessage}: ${res.status}`)
    error.status = res.status
    throw error
  }

  return data
}

// Get all orders for the logged-in customer
export async function getMyOrders() {
  const data = await getJson('/api/orders', 'Could not load orders')
  return data.orders
}

// Get details for one order
export async function getOrderById(orderId) {
  const data = await getJson(`/api/orders/${orderId}`, 'Could not load order details')
  return data.order
}
