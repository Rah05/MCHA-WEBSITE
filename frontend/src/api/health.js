// Calls the backend health route. Add more API helpers in this folder (one file per feature).
export async function getHealth() {
  const res = await fetch('/api/health')
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
  return res.json()
}
