
const API_URL = '/api/orders'

// Get the saved login token
function getAuthHeaders() {
  const token = localStorage.getItem('token')

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// Handle API responses
async function handleResponse(response, defaultMessage) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.error || defaultMessage)
    error.status = response.status
    throw error
  }

  return data
}

// Get all orders for the logged-in customer
export async function getOrders() {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await handleResponse(response, 'Failed to load orders.')
  return data.orders
}

// Get details for one order
export async function getOrderById(orderId) {
  const response = await fetch(`${API_URL}/${orderId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await handleResponse(response, 'Failed to load order details.')
  return data.order
}
