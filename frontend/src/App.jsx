import Home from './pages/Home'
import Registration from './pages/Registration'
import AdminProducts from './pages/AdminProducts'
import Login from './pages/Login'
import OrderHistory from './pages/OrderHistory'
import OrderDetail from './pages/OrderDetail'

// SCRUM-24: Event Booking
import EventBooking from './pages/EventBooking'
import EventRequests from './pages/EventRequests'

function App() {
const path = window.location.pathname.replace(/\/+$/, '') || '/'

// Registration
if (path === '/register') {
return <Registration />
}

// Login
if (path === '/login') {
return <Login />
}

// Order History
if (path === '/orders') {
return <OrderHistory />
}

// Order Details
if (path.startsWith('/orders/')) {
return <OrderDetail />
}

// Admin Product Management
if (path === '/admin/products') {
return <AdminProducts />
}

// SCRUM-24: Customer Event Booking
if (path === '/events/book') {
return <EventBooking />
}

// SCRUM-24: Admin Event Requests
if (path === '/admin/events') {
return <EventRequests />
}

// Home Page
return <Home />
}

export default App