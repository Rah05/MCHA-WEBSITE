
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { getOrders } from '../api/orders'
import './OrderHistory.css'

function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getOrders()
        setOrders(data)
      } catch (err) {
        setError({
          message: err.message,
          status: err.status,
        })
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  function formatDate(date) {
    return new Date(date).toLocaleDateString()
  }

  function formatPrice(price) {
    return `$${Number(price).toFixed(2)}`
  }

  return (
    <>
      <Header />

      <main className="order-history">
        <p className="order-history__label">MY ACCOUNT</p>
        <h1>Order History</h1>
        <p className="order-history__description">
          View your previous purchases and order details.
        </p>

        {loading && <p>Loading your orders...</p>}

        {error && (
          <div className="order-history__error" role="alert">
            <p>{error.message}</p>

            {error.status === 401 && (
              <p>
                Please <a href="/login">log in</a> to view your orders.
              </p>
            )}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <p className="order-history__empty">
            You haven't placed any orders yet.
          </p>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="order-history__list">
            {orders.map((order) => (
              <a
                key={order.id}
                href={`/orders/${order.id}`}
                className="order-history__card"
              >
                <div>
                  <h2>Order #{order.orderNumber}</h2>
                  <p>{formatDate(order.createdAt)}</p>
                  <p>{order.itemCount} item(s)</p>
                </div>

                <div className="order-history__summary">
                  <span className="order-history__status">
                    {order.status}
                  </span>
                  <strong>{formatPrice(order.total)}</strong>
                  <span>View Details →</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default OrderHistory
