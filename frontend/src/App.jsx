import Home from './pages/Home'
import Registration from './pages/Registration'
import OrderHistory from './pages/OrderHistory'

function App() {
  const path = window.location.pathname

  if (path === '/register') {
    return <Registration />
  }

  if (path === '/orders') {
    return <OrderHistory />
  }

  return <Home />
}

export default App