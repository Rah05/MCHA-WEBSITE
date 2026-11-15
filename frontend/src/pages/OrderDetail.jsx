
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { getOrderById } from '../api/orders'
import './OrderDetail.css'

function OrderDetail() {
  const orderId = window.location.pathname.split('/').pop()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await getOrderById(orderId)
        setOrder(data)
      } catch (err) {
        setError({
          message: err.message,
          status: err.status,
        })
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId])

  function formatDate(date) {
    return new Date(date).toLocaleDateString()
  }

  function formatPrice(price) {
    return `$${Number(price).toFixed(2)}`
  }

  return (
    <>
      <Header />

      <main className="order-detail">
        <a href="/orders" className="order-detail__back">
          ← Back to Order History
        </a>

        {loading && <p>Loading order details...</p>}

        {error && (
          <div className="order-detail__error" role="alert">
            <p>{error.message}</p>

            {error.status === 401 && (
              <p>
                Please <a href="/login">log in</a> to view your orders.
              </p>
            )}
            {error.status === 404 && (
              <p>
                This order could not be found.
              </p>
            )}
          </div>
        )}

        {!loading && !error && order && (
          <>
            <p className="order-detail__label">MY ACCOUNT</p>
            <h1>Order #{order.orderNumber}</h1>

            <div className="order-detail__overview">
              <div>
                <span>Order Date</span>
                <strong>{formatDate(order.createdAt)}</strong>
              </div>

              <div>
                <span>Order Status</span>
                <strong className="order-detail__status">
                  {order.status}
                </strong>
              </div>
            </div>

            <section className="order-detail__section">
              <h2>Items Ordered</h2>

              <div className="order-detail__items">
                {order.items.map((item) => (
                  <div className="order-detail__item" key={item.id}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>
                        {formatPrice(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>

                    <strong>{formatPrice(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="order-detail__section order-detail__totals">
              <div>
                <span>Subtotal</span>
                <strong>{formatPrice(order.subtotal)}</strong>
              </div>

              <div className="order-detail__grand-total">
                <span>Total</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  )
}

export default OrderDetail
