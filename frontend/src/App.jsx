import Home from './pages/Home'
import Registration from './pages/Registration'
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

  return <Home />
}

export default App