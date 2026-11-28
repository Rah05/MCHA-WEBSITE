// Calls wholesale routes. Route and field names must match the backend
export async function submitInquiry(inquiry) {
  const res = await fetch('/api/wholesale/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inquiry),
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.error || 'Could not send your request. Please try again.')
    error.status = res.status
    throw error
  }

  return data
}