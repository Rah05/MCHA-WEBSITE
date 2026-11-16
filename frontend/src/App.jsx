import Home from './pages/Home'
import Registration from './pages/Registration'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import OrderHistory from './pages/OrderHistory'
import OrderDetail from './pages/OrderDetail'
import AdminProducts from './pages/AdminProducts'

function App() {
  const path = window.location.pathname

  if (path === '/register') {
    return <Registration />
  }

  if (path === '/login') {
    return <Login />
  }

  // Forgot/reset password flow (SCRUM-100)
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

  return <Home />
}

export default App
