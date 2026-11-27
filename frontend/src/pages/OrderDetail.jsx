
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { getOrderById } from '../api/orders'
import './OrderDetail.css'

// Customer-friendly status labels
const STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

// Status descriptions
const STATUS_DESCRIPTIONS = {
  pending: 'Your order has been received and is awaiting payment confirmation.',
  paid: 'Your payment has been received successfully.',
  fulfilled: 'Your order has been fulfilled. Thank you for shopping with M.CHA!',
  cancelled: 'This order has been cancelled.',
  refunded: 'This order has been refunded.',
}

// Normal order progress
const ORDER_STEPS = [
  { status: 'pending', label: 'Order Pending' },
  { status: 'paid', label: 'Payment Received' },
  { status: 'fulfilled', label: 'Fulfilled' },
]

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatPrice(price) {
  return `$${Number(price).toFixed(2)}`
}

// Order progress component
function OrderProgress({ status, updatedAt }) {
  const currentStep = ORDER_STEPS.findIndex(
    (step) => step.status === status
  )

  const isFinalStatus = status === 'cancelled' || status === 'refunded'
  const isValidStatus = currentStep !== -1 || isFinalStatus

  return (
    <section className="order-detail__section order-progress">
      <h2>Order Status</h2>

      <div className={`order-progress__message order-progress__message--${status}`}>
        <h3>{STATUS_LABELS[status] || status}</h3>
        <p>
          {STATUS_DESCRIPTIONS[status] ||
            'Please contact us for more information about your order.'}
        </p>
      </div>

      {!isFinalStatus && isValidStatus && (
        <div className="order-progress__steps">
          <div className="order-progress__bar">
            {ORDER_STEPS.map((step, index) => {
              const isCompleted =
                status === 'fulfilled' || index < currentStep
              const isCurrent = index === currentStep

              let stepClass = 'order-progress__step'

              if (isCompleted) {
                stepClass += ' order-progress__step--completed'
              } else if (isCurrent) {
                stepClass += ' order-progress__step--current'
              }

              return (
                <div className={stepClass} key={step.status}>
                  <div className="order-progress__circle">
                    {isCompleted ? '✓' : index + 1}
                  </div>

                  <span>{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!isValidStatus && (
        <p className="order-progress__unknown">
          The current status of your order is being updated.
        </p>
      )}

      {updatedAt && (
        <p className="order-progress__updated">
          Last updated: {formatDate(updatedAt)}
        </p>
      )}
    </section>
  )
}

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
              <p>This order could not be found.</p>
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
                  {STATUS_LABELS[order.status] || order.status}
                </strong>
              </div>
            </div>

            <OrderProgress
              status={order.status}
              updatedAt={order.updatedAt}
            />

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
