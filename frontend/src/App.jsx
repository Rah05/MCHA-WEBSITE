import Home from './pages/Home'
import Registration from './pages/Registration'

function App() {
  const path = window.location.pathname

  if (path === '/register') {
    return <Registration />
  }

  return <Home />
}

export default App