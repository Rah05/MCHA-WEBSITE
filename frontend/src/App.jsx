import Home from './pages/Home'
import Registration from './pages/Registration'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import OrderHistory from './pages/OrderHistory'
import OrderDetail from './pages/OrderDetail'
import AdminProducts from './pages/AdminProducts'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentPage from './pages/PaymentPage'

function App() {
const path =
window.location.pathname.replace(/\/+$/, '') || '/'

if (path === '/register') {
return <Registration />
}

if (path === '/login') {
return <Login />
}

if (path === '/forgot-password') {
return <ForgotPassword />
}

if (path === '/reset-password') {
return <ResetPassword />
}

if (path === '/orders') {
return <OrderHistory />
}

if (path.startsWith('/orders/')) {
return <OrderDetail />
}

if (path === '/admin/products') {
return <AdminProducts />
}

if (path === '/cart') {
return <CartPage />
}

if (path === '/checkout') {
return <CheckoutPage />
}

if (path === '/payment') {
return <PaymentPage />
}

return <Home />
}

export default App