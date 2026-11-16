
import Home from './pages/Home'
import Registration from './pages/Registration'
import AdminProducts from './pages/AdminProducts'
import OrderHistory from './pages/OrderHistory'
import Login from './pages/Login'

function App() {
  const path = window.location.pathname

  if (path === '/register') {
    return <Registration />
  }

  if (path === '/orders') {
    return <OrderHistory />
  }

  if (path === '/login') {
    return <Login />
  }

  if (path === '/admin/products') {
    return <AdminProducts />
  }

  return <Home />
}

export default App
