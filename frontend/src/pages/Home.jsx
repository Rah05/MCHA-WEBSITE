import { useEffect, useState } from 'react'
import { getHealth } from '../api/health'

// Placeholder homepage. Hazuki builds the real layout in SCRUM-32 / SCRUM-33.
function Home() {
  const [api, setApi] = useState('checking...')

  useEffect(() => {
    getHealth()
      .then((data) => setApi(`${data.status} (database: ${data.database})`))
      .catch(() => setApi('unreachable'))
  }, [])

  return (
    <main className="home">
      <h1>M.CHA</h1>
      <p>Website under construction.</p>
      <p className="status">API status: {api}</p>
    </main>
  )
}

export default Home
