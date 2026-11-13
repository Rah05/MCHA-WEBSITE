import Home from './pages/Home'
import Registration from './pages/Registration'
import AdminProducts from './pages/AdminProducts'

function App() {
  const path = window.location.pathname

  if (path === '/register') {
    return <Registration />
  }

  if (path === '/admin/products'){
    return <AdminProducts />
  }

  return <Home />
}

export default App