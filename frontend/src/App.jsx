
import Home from './pages/Home'
import Registration from './pages/Registration'
import AdminProducts from './pages/AdminProducts'
import Login from './pages/Login'
import OrderHistory from './pages/OrderHistory'
import OrderDetail from './pages/OrderDetail'

function App() {
  const path = window.location.pathname

  if (path === '/register') {
    return <Registration />
  }

  if (path === '/login') {
    return <Login />
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
