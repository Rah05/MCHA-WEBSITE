
import { useEffect, useState } from 'react'
import { logOut } from '../api/auth'
import './AdminOrders.css'

const sampleOrders = [
  {
    id: 'M-2303',
    customer: 'Aiko Tanaka',
    channel: 'Pickup',
    total: 30,
    status: 'Preparing',
    email: 'aiko@example.com',
    customerId: 'MC-1042',
    pickup: 'Midtown Market',
    date: 'Saturday, October 3',
    items: [{ name: 'M. Blend 30g', quantity: 1, price: 30 }],
    note: 'Your order is ready at the M.CHA stand!',
  },
  {
    id: 'M-2304',
    customer: 'Daniel Cruz',
    channel: 'Online',
    total: 54,
    status: 'New',
    email: 'daniel@example.com',
    customerId: 'MC-1043',
    pickup: 'Online order',
    date: 'October 4',
    items: [{ name: 'Matcha Latte Set', quantity: 2, price: 27 }],
    note: '',
  },
  {
    id: 'M-2302',
    customer: 'Walk-in Customer',
    channel: 'Pop-up',
    total: 14,
    status: 'Completed',
    email: '—',
    customerId: 'Guest',
    pickup: 'Pop-up Market',
    date: 'October 2',
    items: [{ name: 'Yuzu Matcha', quantity: 1, price: 14 }],
    note: '',
  },
  {
    id: 'M-2301',
    customer: 'Priya Shah',
    channel: 'Online',
    total: 88,
    status: 'Ready',
    email: 'priya@example.com',
    customerId: 'MC-1041',
    pickup: 'Midtown Market',
    date: 'October 2',
    items: [{ name: 'Matcha Gift Set', quantity: 2, price: 44 }],
    note: '',
  },
  {
    id: 'M-2299',
    customer: 'Kōyō Café',
    channel: 'Wholesale',
    total: 420,
    status: 'Preparing',
    email: 'hello@example.com',
    customerId: 'MC-1039',
    pickup: 'Wholesale delivery',
    date: 'October 1',
    items: [{ name: 'Ceremonial Matcha Bulk', quantity: 4, price: 105 }],
    note: '',
  },
]

const sampleInquiries = [
  {
    id: 'I-1001',
    initials: 'HS',
    name: 'Hana Sato',
    email: 'hana@example.com',
    message:
      'Do you sell matcha in bulk for cafés? I am interested in learning about your wholesale options.',
    date: 'October 5, 2026',
    status: 'New',
    adminNote: '',
  },
  {
    id: 'I-1002',
    initials: 'JM',
    name: 'Jordan Miles',
    email: 'jordan@example.com',
    message:
      'Is the Yuzu soda coming back this fall? I really enjoyed it last time!',
    date: 'October 5, 2026',
    status: 'In Progress',
    adminNote: 'Check with the team about the seasonal menu.',
  },
  {
    id: 'I-1003',
    initials: 'LB',
    name: 'Leaf & Bean Co.',
    email: 'hello@leafandbean.com',
    message:
      'Wholesale application follow-up. We would like to discuss placing a regular order for our café.',
    date: 'October 4, 2026',
    status: 'Done',
    adminNote: 'Replied with wholesale information.',
  },
]

const sampleBookings = [
  {
    id: 'E-1001',
    name: 'Lee & Park Wedding',
    customer: 'Emily Lee',
    email: 'emily@example.com',
    eventType: 'Wedding',
    date: 'October 10, 2026',
    location: 'Sacramento, CA',
    guests: 120,
    message:
      'We would love to have a matcha latte bar at our wedding reception.',
    status: 'Confirmed',
    adminNote: 'Confirm setup time with the event team.',
  },
  {
    id: 'E-1002',
    name: 'Intel Sacramento',
    customer: 'Michael Chen',
    email: 'michael@example.com',
    eventType: 'Corporate Event',
    date: 'October 18, 2026',
    location: 'Downtown Sacramento',
    guests: 40,
    message:
      'We are planning a company event and would like to offer matcha drinks to our employees.',
    status: 'Pending',
    adminNote: '',
  },
  {
    id: 'E-1003',
    name: 'Ortiz Birthday',
    customer: 'Sofia Ortiz',
    email: 'sofia@example.com',
    eventType: 'Private Party',
    date: 'October 25, 2026',
    location: 'Roseville, CA',
    guests: 25,
    message:
      'Looking for a matcha drink catering option for a birthday party.',
    status: 'Pending',
    adminNote: '',
  },
]

function AdminOrders() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Orders
  const [orders, setOrders] = useState(sampleOrders)
  const [selectedOrderId, setSelectedOrderId] = useState(sampleOrders[0].id)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [channelFilter, setChannelFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('Orders')
  const [newStatus, setNewStatus] = useState(sampleOrders[0].status)
  const [customerNote, setCustomerNote] = useState(sampleOrders[0].note)
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState({ ...sampleOrders[0] })

  // Inquiries
  const [inquiries, setInquiries] = useState(sampleInquiries)
  const [selectedInquiryId, setSelectedInquiryId] = useState(
    sampleInquiries[0].id
  )
  const [inquiryStatus, setInquiryStatus] = useState(sampleInquiries[0].status)
  const [inquiryNote, setInquiryNote] = useState(sampleInquiries[0].adminNote)
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('All')

  // Event bookings
  const [bookings, setBookings] = useState(sampleBookings)
  const [selectedBookingId, setSelectedBookingId] = useState(
    sampleBookings[0].id
  )
  const [bookingStatus, setBookingStatus] = useState(sampleBookings[0].status)
  const [bookingNote, setBookingNote] = useState(sampleBookings[0].adminNote)
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All')

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const searchText = search.toLowerCase()

    const searchMatch =
      order.id.toLowerCase().includes(searchText) ||
      order.customer.toLowerCase().includes(searchText)

    const statusMatch =
      statusFilter === 'All' || order.status === statusFilter

    const channelMatch =
      channelFilter === 'All' || order.channel === channelFilter

    return searchMatch && statusMatch && channelMatch
  })

  // Selected order
  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) || null

  // Filter inquiries
  const filteredInquiries = inquiries.filter((inquiry) => {
    const searchText = search.toLowerCase()

    const searchMatch =
      inquiry.name.toLowerCase().includes(searchText) ||
      inquiry.email.toLowerCase().includes(searchText) ||
      inquiry.message.toLowerCase().includes(searchText)

    const statusMatch =
      inquiryStatusFilter === 'All' ||
      inquiry.status === inquiryStatusFilter

    return searchMatch && statusMatch
  })

  // Selected inquiry
  const selectedInquiry =
    filteredInquiries.find(
      (inquiry) => inquiry.id === selectedInquiryId
    ) || filteredInquiries[0] || null

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const searchText = search.toLowerCase()

    const searchMatch =
      booking.id.toLowerCase().includes(searchText) ||
      booking.name.toLowerCase().includes(searchText) ||
      booking.customer.toLowerCase().includes(searchText) ||
      booking.email.toLowerCase().includes(searchText) ||
      booking.eventType.toLowerCase().includes(searchText)

    const statusMatch =
      bookingStatusFilter === 'All' ||
      booking.status === bookingStatusFilter

    return searchMatch && statusMatch
  })

  // Selected booking
  const selectedBooking =
    filteredBookings.find(
      (booking) => booking.id === selectedBookingId
    ) || filteredBookings[0] || null

  // Keep the selected inquiry synchronized with the filtered list
  useEffect(() => {
    if (!filteredInquiries.length) return

    const currentInquiry = filteredInquiries.find(
      (inquiry) => inquiry.id === selectedInquiryId
    )

    if (!currentInquiry) {
      const firstInquiry = filteredInquiries[0]

      setSelectedInquiryId(firstInquiry.id)
      setInquiryStatus(firstInquiry.status)
      setInquiryNote(firstInquiry.adminNote)
    }
  }, [filteredInquiries, selectedInquiryId])

  // Keep the selected booking synchronized with the filtered list
  useEffect(() => {
    if (!filteredBookings.length) return

    const currentBooking = filteredBookings.find(
      (booking) => booking.id === selectedBookingId
    )

    if (!currentBooking) {
      const firstBooking = filteredBookings[0]

      setSelectedBookingId(firstBooking.id)
      setBookingStatus(firstBooking.status)
      setBookingNote(firstBooking.adminNote)
    }
  }, [filteredBookings, selectedBookingId])

  // Select order
  function selectOrder(order) {
    setSelectedOrderId(order.id)
    setNewStatus(order.status)
    setCustomerNote(order.note)

    setEditDraft({
      ...order,
      items: order.items.map((item) => ({ ...item })),
    })

    setIsEditing(false)
  }

  // Edit order
  function startEditing() {
    if (!selectedOrder) return

    setEditDraft({
      ...selectedOrder,
      items: selectedOrder.items.map((item) => ({ ...item })),
    })

    setIsEditing(true)
  }

  function updateDraft(field, value) {
    setEditDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateDraftItem(index, field, value) {
    setEditDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }))
  }

  function addItem() {
    setEditDraft((current) => ({
      ...current,
      items: [
        ...current.items,
        { name: '', quantity: 1, price: 0 },
      ],
    }))
  }

  function removeItem(index) {
    setEditDraft((current) => ({
      ...current,
      items: current.items.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }))
  }

  const calculatedTotal = editDraft.items.reduce(
    (sum, item) =>
      sum +
      (Number(item.quantity) || 0) *
        (Number(item.price) || 0),
    0
  )

  function saveOrder() {
    if (!editDraft.customer.trim()) {
      alert('Please enter a customer name.')
      return
    }

    if (editDraft.items.length === 0) {
      alert('Please add at least one item.')
      return
    }

    const invalidItem = editDraft.items.some(
      (item) =>
        !item.name.trim() ||
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        !Number.isFinite(Number(item.price)) ||
        Number(item.price) < 0
    )

    if (invalidItem) {
      alert('Please check the product names, quantities, and prices.')
      return
    }

    const updatedOrder = {
      ...editDraft,
      total: calculatedTotal,
      status: newStatus,
      note: customerNote,
      items: editDraft.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        price: Number(item.price),
      })),
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === selectedOrderId ? updatedOrder : order
      )
    )

    setEditDraft(updatedOrder)
    setIsEditing(false)

    alert('Order updated (sample data only).')
  }

  function cancelEditing() {
    if (!selectedOrder) return

    setEditDraft({
      ...selectedOrder,
      items: selectedOrder.items.map((item) => ({ ...item })),
    })

    setIsEditing(false)
  }

  // Save order status and note
  function saveStatusAndNote() {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === selectedOrderId
          ? { ...order, status: newStatus, note: customerNote }
          : order
      )
    )

    alert('Order updated (sample data only).')
  }

  // Cancel order
  function cancelOrder() {
    if (!window.confirm(`Cancel order ${selectedOrderId}?`)) return

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === selectedOrderId
          ? { ...order, status: 'Cancelled' }
          : order
      )
    )

    setNewStatus('Cancelled')
  }

  // Export filtered orders
  function exportOrders() {
    const header = ['Order', 'Customer', 'Channel', 'Total', 'Status']

    const rows = filteredOrders.map((order) => [
      order.id,
      order.customer,
      order.channel,
      order.total,
      order.status,
    ])

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(',')
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'mcha-orders.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  // Select inquiry
  function selectInquiry(inquiry) {
    setSelectedInquiryId(inquiry.id)
    setInquiryStatus(inquiry.status)
    setInquiryNote(inquiry.adminNote)
  }

  // Save inquiry
  function saveInquiry() {
    if (!selectedInquiry) return

    setInquiries((currentInquiries) =>
      currentInquiries.map((inquiry) =>
        inquiry.id === selectedInquiry.id
          ? {
              ...inquiry,
              status: inquiryStatus,
              adminNote: inquiryNote,
            }
          : inquiry
      )
    )

    alert('Inquiry updated (sample data only).')
  }

  // Select booking
  function selectBooking(booking) {
    setSelectedBookingId(booking.id)
    setBookingStatus(booking.status)
    setBookingNote(booking.adminNote)
  }

  // Save booking
  function saveBooking() {
    if (!selectedBooking) return

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === selectedBooking.id
          ? {
              ...booking,
              status: bookingStatus,
              adminNote: bookingNote,
            }
          : booking
      )
    )

    alert('Event booking updated (sample data only).')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="admin-orders-layout">
      {/* Mobile header */}
      <div className="admin-orders-mobile-header">
        <span>M.CHA</span>

        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '×' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`admin-orders-sidebar ${menuOpen ? 'menu-open' : ''}`}
      >
        <div className="admin-orders-brand">
          <div className="admin-orders-brand-name">M.CHA</div>
          <span>ADMIN</span>
        </div>

        <nav className="admin-orders-nav">
          <a href="#dashboard" onClick={closeMenu}>Dashboard</a>
          <a href="#products" onClick={closeMenu}>Products & Pricing</a>
          <a href="#wholesale" onClick={closeMenu}>Wholesale</a>
          <a href="#calendar" onClick={closeMenu}>Pop-ups & Calendar</a>
          <a href="#events" onClick={closeMenu}>Event Requests</a>

          <a
            className="active"
            href="/admin/orders"
            onClick={closeMenu}
          >
            Orders & Inquiries
          </a>

          <a href="#schedules" onClick={closeMenu}>Employee Schedules</a>
          <a href="#visitors" onClick={closeMenu}>Visitor Records</a>
        </nav>

        <div className="admin-orders-user">
          <div className="admin-orders-avatar">A</div>

          <div>
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>
        </div>

        <button
          className="admin-orders-signout"
          type="button"
          onClick={logOut}
        >
          Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="admin-orders-main">
        <header className="admin-orders-header">
          <div>
            <p className="admin-orders-eyebrow">MANAGEMENT</p>
            <h1>Orders & Inquiries</h1>

            <p>
              Everything customers have sent in — online orders,
              walk-in purchases, questions and event bookings.
            </p>
          </div>
        </header>

        {/* Search and filters */}
        <div className="admin-orders-toolbar">
          <input
            type="search"
            placeholder={
              activeTab === 'Inquiries'
                ? 'Search by name, email or message'
                : activeTab === 'Event bookings'
                  ? 'Search by event, customer or email'
                  : 'Search by name or order #'
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {activeTab === 'Orders' && (
            <>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Preparing">Preparing</option>
                <option value="Ready">Ready</option>
                <option value="Shipped">Shipped</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={channelFilter}
                onChange={(event) => setChannelFilter(event.target.value)}
              >
                <option value="All">All Channels</option>
                <option value="Online">Online</option>
                <option value="Pickup">Pickup</option>
                <option value="Pop-up">Pop-up</option>
                <option value="Wholesale">Wholesale</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('All')
                  setChannelFilter('All')
                }}
              >
                Clear Filters
              </button>

              <button type="button" onClick={exportOrders}>
                Export
              </button>
            </>
          )}

          {activeTab === 'Inquiries' && (
            <>
              <select
                value={inquiryStatusFilter}
                onChange={(event) =>
                  setInquiryStatusFilter(event.target.value)
                }
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setInquiryStatusFilter('All')
                }}
              >
                Clear Filters
              </button>
            </>
          )}

          {activeTab === 'Event bookings' && (
            <>
              <select
                value={bookingStatusFilter}
                onChange={(event) =>
                  setBookingStatusFilter(event.target.value)
                }
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setBookingStatusFilter('All')
                }}
              >
                Clear Filters
              </button>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="admin-orders-tabs">
          {['Orders', 'Inquiries', 'Event bookings'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'active' : ''}
              onClick={() => {
                setActiveTab(tab)
                setSearch('')
              }}
            >
              {tab}

              {tab === 'Orders' && <span>{orders.length}</span>}
              {tab === 'Inquiries' && <span>{inquiries.length}</span>}
              {tab === 'Event bookings' && <span>{bookings.length}</span>}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {activeTab === 'Orders' ? (
          <>
            <div className="admin-orders-content">
              <section className="admin-orders-list">
                <div className="admin-list-heading">
                    <h2>All orders</h2>
                    <span>
                        Showing {filteredOrders.length} of {orders.length} orders
                    </span>
                </div>

                <div className="admin-orders-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ORDER</th>
                        <th>CUSTOMER</th>
                        <th>CHANNEL</th>
                        <th>TOTAL</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className={
                            selectedOrderId === order.id ? 'selected' : ''
                          }
                          onClick={() => selectOrder(order)}
                        >
                          <td>{order.id}</td>
                          <td>{order.customer}</td>
                          <td>{order.channel}</td>
                          <td>${order.total.toFixed(2)}</td>
                          <td>
                            <span
                              className={`order-status ${order.status.toLowerCase()}`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan="5">No orders found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {selectedOrder && (
                <section className="admin-order-detail">
                  <div className="admin-order-detail-top">
                    <div>
                      <p>ORDER DETAILS</p>
                      <h2>{selectedOrder.id}</h2>
                    </div>

                    <span
                      className={`order-status ${selectedOrder.status.toLowerCase()}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>

                  {isEditing ? (
                    <>
                      <div className="admin-order-edit-heading">
                        <h3>Edit Order</h3>
                        <p>Update customer and order information.</p>
                      </div>

                      <h3>Customer Information</h3>

                      <label htmlFor="edit-customer">Customer Name</label>
                      <input
                        id="edit-customer"
                        type="text"
                        value={editDraft.customer}
                        onChange={(event) =>
                          updateDraft('customer', event.target.value)
                        }
                      />

                      <label htmlFor="edit-email">Email</label>
                      <input
                        id="edit-email"
                        type="email"
                        value={editDraft.email}
                        onChange={(event) =>
                          updateDraft('email', event.target.value)
                        }
                      />

                      <label htmlFor="edit-customer-id">Customer ID</label>
                      <input
                        id="edit-customer-id"
                        type="text"
                        value={editDraft.customerId}
                        onChange={(event) =>
                          updateDraft('customerId', event.target.value)
                        }
                      />

                      <h3>Order Information</h3>

                      <label htmlFor="edit-channel">Channel</label>
                      <select
                        id="edit-channel"
                        value={editDraft.channel}
                        onChange={(event) =>
                          updateDraft('channel', event.target.value)
                        }
                      >
                        <option value="Pickup">Pickup</option>
                        <option value="Online">Online</option>
                        <option value="Pop-up">Pop-up</option>
                        <option value="Wholesale">Wholesale</option>
                      </select>

                      <label htmlFor="edit-pickup">Pickup / Delivery</label>
                      <input
                        id="edit-pickup"
                        type="text"
                        value={editDraft.pickup}
                        onChange={(event) =>
                          updateDraft('pickup', event.target.value)
                        }
                      />

                      <label htmlFor="edit-date">Order Date</label>
                      <input
                        id="edit-date"
                        type="text"
                        value={editDraft.date}
                        onChange={(event) =>
                          updateDraft('date', event.target.value)
                        }
                      />

                      <div className="admin-order-edit-items-heading">
                        <h3>Items Ordered</h3>
                        <button type="button" onClick={addItem}>
                          + Add Item
                        </button>
                      </div>

                      {editDraft.items.map((item, index) => (
                        <div className="admin-order-edit-item" key={index}>
                          <label htmlFor={`item-name-${index}`}>
                            Product Name
                          </label>

                          <input
                            id={`item-name-${index}`}
                            type="text"
                            value={item.name}
                            onChange={(event) =>
                              updateDraftItem(index, 'name', event.target.value)
                            }
                          />

                          <div className="admin-order-edit-item-fields">
                            <div>
                              <label htmlFor={`item-quantity-${index}`}>
                                Quantity
                              </label>

                              <input
                                id={`item-quantity-${index}`}
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateDraftItem(
                                    index,
                                    'quantity',
                                    event.target.value
                                  )
                                }
                              />
                            </div>

                            <div>
                              <label htmlFor={`item-price-${index}`}>
                                Unit Price ($)
                              </label>

                              <input
                                id={`item-price-${index}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={(event) =>
                                  updateDraftItem(
                                    index,
                                    'price',
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          </div>

                          <button
                            className="admin-order-remove-item"
                            type="button"
                            onClick={() => removeItem(index)}
                          >
                            Remove item
                          </button>
                        </div>
                      ))}

                      <div className="admin-order-total">
                        <span>Updated Total</span>
                        <strong>${calculatedTotal.toFixed(2)}</strong>
                      </div>

                      <div className="admin-order-edit-actions">
                        <button
                          className="save-order-button"
                          type="button"
                          onClick={saveOrder}
                        >
                          Save Changes
                        </button>

                        <button
                          className="cancel-order-button"
                          type="button"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="admin-order-customer">
                        <h3>{selectedOrder.customer}</h3>
                        <p>{selectedOrder.customerId}</p>
                        <p>{selectedOrder.email}</p>
                      </div>

                      <div className="admin-order-info">
                        <div>
                          <span>Pickup / Delivery</span>
                          <strong>{selectedOrder.pickup}</strong>
                        </div>

                        <div>
                          <span>Date</span>
                          <strong>{selectedOrder.date}</strong>
                        </div>
                      </div>

                      <h3>Items ordered</h3>

                      {selectedOrder.items.map((item, index) => (
                        <div
                          className="admin-order-item"
                          key={`${item.name}-${index}`}
                        >
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <strong>
                            ${(item.price * item.quantity).toFixed(2)}
                          </strong>
                        </div>
                      ))}

                      <div className="admin-order-total">
                        <span>Total</span>
                        <strong>${selectedOrder.total.toFixed(2)}</strong>
                      </div>

                      <button
                        className="admin-order-edit-button"
                        type="button"
                        onClick={startEditing}
                      >
                        Edit Order
                      </button>

                      <label htmlFor="order-status">Update status</label>

                      <select
                        id="order-status"
                        value={newStatus}
                        onChange={(event) => setNewStatus(event.target.value)}
                      >
                        {[
                          'New',
                          'Preparing',
                          'Ready',
                          'Shipped',
                          'Completed',
                          'Cancelled',
                        ].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <label htmlFor="customer-note">Note to customer</label>

                      <textarea
                        id="customer-note"
                        rows="3"
                        value={customerNote}
                        onChange={(event) =>
                          setCustomerNote(event.target.value)
                        }
                        placeholder="Write a message to the customer..."
                      />

                      <button
                        className="save-order-button"
                        type="button"
                        onClick={saveStatusAndNote}
                      >
                        Save & Notify
                      </button>

                      <button
                        className="cancel-order-button"
                        type="button"
                        onClick={cancelOrder}
                      >
                        Cancel Order
                      </button>
                    </>
                  )}
                </section>
              )}
            </div>

            {/* Recent inquiries and event bookings */}
            <div className="admin-orders-bottom">
              <section className="admin-orders-preview">
                <h2>Recent inquiries</h2>

                <div className="admin-orders-preview-list">
                  {inquiries.map((inquiry) => (
                    <div className="admin-inquiry-item" key={inquiry.id}>
                      <div className="admin-inquiry-avatar">
                        {inquiry.initials}
                      </div>

                      <div className="admin-inquiry-info">
                        <strong>{inquiry.name}</strong>
                        <p>{inquiry.message}</p>
                      </div>

                      <span className="admin-inquiry-time">
                        {inquiry.date}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-orders-preview">
                <h2>Event bookings</h2>

                <div className="admin-booking-list">
                  {bookings.map((booking) => (
                    <div className="admin-booking-item" key={booking.id}>
                      <div className="admin-booking-info">
                        <strong>{booking.name}</strong>
                        <p>
                          {booking.date} · {booking.guests} guests
                        </p>
                      </div>

                      <span
                        className={`admin-booking-status ${booking.status.toLowerCase()}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : activeTab === 'Inquiries' ? (
          <div className="admin-inquiries-content">
            <section className="admin-inquiries-list">
              <div className="admin-list-heading">
                <h2>All inquiries</h2>
                <span>
                    Showing {filteredInquiries.length} of {inquiries.length} inquiries
                </span>
              </div>

              {filteredInquiries.map((inquiry) => (
                <button
                  type="button"
                  className={`admin-inquiry-row ${
                    selectedInquiry?.id === inquiry.id ? 'selected' : ''
                  }`}
                  key={inquiry.id}
                  onClick={() => selectInquiry(inquiry)}
                >
                  <div className="admin-inquiry-avatar">
                    {inquiry.initials}
                  </div>

                  <div className="admin-inquiry-row-info">
                    <strong>{inquiry.name}</strong>
                    <span>{inquiry.email}</span>
                    <p>{inquiry.message}</p>
                  </div>

                  <span
                    className={`inquiry-status ${inquiry.status
                      .toLowerCase()
                      .replace(' ', '-')}`}
                  >
                    {inquiry.status}
                  </span>
                </button>
              ))}

              {filteredInquiries.length === 0 && (
                <p>No inquiries found.</p>
              )}
            </section>

            {selectedInquiry && (
              <section className="admin-inquiry-detail">
                <div className="admin-order-detail-top">
                  <div>
                    <p>INQUIRY DETAILS</p>
                    <h2>{selectedInquiry.id}</h2>
                  </div>

                  <span
                    className={`inquiry-status ${inquiryStatus
                      .toLowerCase()
                      .replace(' ', '-')}`}
                  >
                    {inquiryStatus}
                  </span>
                </div>

                <div className="admin-order-customer">
                  <h3>{selectedInquiry.name}</h3>
                  <p>{selectedInquiry.email}</p>
                  <p>{selectedInquiry.date}</p>
                </div>

                <h3>Message</h3>

                <p className="admin-inquiry-full-message">
                  {selectedInquiry.message}
                </p>

                <label htmlFor="inquiry-status">Update status</label>

                <select
                  id="inquiry-status"
                  value={inquiryStatus}
                  onChange={(event) => setInquiryStatus(event.target.value)}
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>

                <label htmlFor="inquiry-note">Admin Notes</label>

                <textarea
                  id="inquiry-note"
                  rows="5"
                  value={inquiryNote}
                  onChange={(event) => setInquiryNote(event.target.value)}
                  placeholder="Add an internal note..."
                />

                <button
                  className="save-order-button"
                  type="button"
                  onClick={saveInquiry}
                >
                  Save Changes
                </button>
              </section>
            )}
          </div>
        ) : activeTab === 'Event bookings' ? (
          <div className="admin-bookings-content">
            <section className="admin-inquiries-list">
              <div className="admin-list-heading">
                <h2>All event bookings</h2>
                <span>
                    Showing {filteredBookings.length} of {bookings.length} bookings
                </span>
              </div>

              {filteredBookings.map((booking) => (
                <button
                  type="button"
                  className={`admin-inquiry-row ${
                    selectedBooking?.id === booking.id ? 'selected' : ''
                  }`}
                  key={booking.id}
                  onClick={() => selectBooking(booking)}
                >
                  <div className="admin-inquiry-row-info">
                    <strong>{booking.name}</strong>

                    <span>
                      {booking.customer} · {booking.email}
                    </span>

                    <p>
                      {booking.date} · {booking.guests} guests
                    </p>
                  </div>

                  <span
                    className={`inquiry-status ${booking.status.toLowerCase()}`}
                  >
                    {booking.status}
                  </span>
                </button>
              ))}

              {filteredBookings.length === 0 && (
                <p>No event bookings found.</p>
              )}
            </section>

            {selectedBooking && (
              <section className="admin-inquiry-detail">
                <div className="admin-order-detail-top">
                  <div>
                    <p>EVENT BOOKING DETAILS</p>
                    <h2>{selectedBooking.id}</h2>
                  </div>

                  <span
                    className={`inquiry-status ${bookingStatus.toLowerCase()}`}
                  >
                    {bookingStatus}
                  </span>
                </div>

                <div className="admin-order-customer">
                  <h3>{selectedBooking.name}</h3>
                  <p>{selectedBooking.customer}</p>
                  <p>{selectedBooking.email}</p>
                </div>

                <h3>Event Information</h3>

                <div className="admin-order-info">
                  <div>
                    <span>Event Type</span>
                    <strong>{selectedBooking.eventType}</strong>
                  </div>

                  <div>
                    <span>Event Date</span>
                    <strong>{selectedBooking.date}</strong>
                  </div>

                  <div>
                    <span>Location</span>
                    <strong>{selectedBooking.location}</strong>
                  </div>

                  <div>
                    <span>Expected Guests</span>
                    <strong>{selectedBooking.guests} guests</strong>
                  </div>
                </div>

                <h3>Customer Message</h3>

                <p className="admin-booking-message">
                  {selectedBooking.message}
                </p>

                <label htmlFor="booking-status">Update status</label>

                <select
                  id="booking-status"
                  value={bookingStatus}
                  onChange={(event) => setBookingStatus(event.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <label htmlFor="booking-note">Internal Note</label>

                <textarea
                  id="booking-note"
                  rows="5"
                  value={bookingNote}
                  onChange={(event) => setBookingNote(event.target.value)}
                  placeholder="Add an internal note..."
                />

                <button
                  className="save-order-button"
                  type="button"
                  onClick={saveBooking}
                >
                  Save Changes
                </button>
              </section>
            )}
          </div>
        ) : (
          <div className="admin-orders-placeholder">
            <h2>{activeTab}</h2>
            <p>This section is a preview only for SCRUM-105.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminOrders
