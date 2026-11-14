// Order History Page

import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getMyOrders, getToken } from '../api/orders'
import './OrderHistory.css'

// Status Labels
const STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

// Date Formatting
function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Dollar Amount
function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`
}

// Order History Page
function OrderHistory() {
  const signedIn = Boolean(getToken())

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(signedIn)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!signedIn) return

    getMyOrders()
      .then((data) => setOrders(data))
      .catch((error) => {
        if (error.status === 401) {
          setSessionExpired(true)
        } else if (error.status) {
          setMessage(error.message)
        } else {
          setMessage('Unable to connect to the backend. Make sure backend is running.')
        }
      })
      .finally(() => setLoading(false))
  }, [signedIn])

  let content

  if (!signedIn || sessionExpired) {
    content = (
      <Card title="Please sign in">
        <p>
          {sessionExpired
            ? 'Your session has expired. Please sign in again to see your orders.'
            : 'Sign in to see your past orders.'}
        </p>
        <Button href="/login">Log in</Button>
      </Card>
    )
  } else if (loading) {
    content = <p>Loading orders...</p>
  } else if (message) {
    content = <p className="order-error" role="alert">{message}</p>
  } else if (orders.length === 0) {
    content = (
      <Card title="No orders yet">
        <p>You haven't placed any orders yet.</p>
        <Button href="/shop">Shop M.CHA</Button>
      </Card>
    )
  } else {
    content = (
      <Card>
        <div className="order-table-wrapper">
          <table className="order-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.orderNumber}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <span className={`order-status order-status--${order.status}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td>{order.itemCount}</td>
                  <td>{formatMoney(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Header />
      <main className="order-history">
        <h1>Order history</h1>
        {content}
      </main>
    </>
  )
}

export default OrderHistory