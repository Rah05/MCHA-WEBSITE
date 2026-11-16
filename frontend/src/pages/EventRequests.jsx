import { useState } from 'react';
import './EventRequests.css';

const initialRequests = [
{
id: 1,
name: 'Lee & Park Wedding',
email: 'lee@example.com',
date: '2026-11-14',
guests: 120,
type: 'Wedding',
details: 'Matcha bar for wedding guests',
status: 'Pending'
},
{
id: 2,
name: 'Intel Sacramento',
email: 'events@example.com',
date: '2026-11-18',
guests: 40,
type: 'Corporate',
details: 'Tea tasting for employees',
status: 'Pending'
},
{
id: 3,
name: 'Ortiz Birthday',
email: 'ortiz@example.com',
date: '2026-11-25',
guests: 25,
type: 'Birthday',
details: 'Matcha drinks and desserts',
status: 'Pending'
}
];

const emptyForm = {
name: '',
email: '',
date: '',
guests: '',
type: 'Wedding',
details: ''
};

function EventRequests() {
const [requests, setRequests] = useState(initialRequests);
const [filter, setFilter] = useState('All');
const [showForm, setShowForm] = useState(false);
const [form, setForm] = useState(emptyForm);
const [selectedRequest, setSelectedRequest] = useState(null);

const filteredRequests = requests.filter(
(request) => filter === 'All' || request.status === filter
);

const updateStatus = (id, status) => {
setRequests((current) =>
current.map((request) =>
request.id === id ? { ...request, status } : request
)
);
};

const submitRequest = (event) => {
event.preventDefault();

const newRequest = {
...form,
id: Date.now(),
guests: Number(form.guests),
status: 'Pending'
};

setRequests((current) => [newRequest, ...current]);
setForm(emptyForm);
setShowForm(false);
};

const pending = requests.filter((r) => r.status === 'Pending').length;
const approved = requests.filter((r) => r.status === 'Approved').length;
const declined = requests.filter((r) => r.status === 'Declined').length;

return (
<div className="event-layout">
<aside className="event-sidebar">
<div className="event-logo">
M.CHA <span>ADMIN</span>
</div>

<nav>
<div>Dashboard</div>
<div>Products & Pricing</div>
<div>Wholesale</div>
<div>Pop-ups & Calendar</div>
<div className="active">Event Requests</div>
<div>Orders & Inquiries</div>
<div>Employee Schedules</div>
<div>Visitor Records</div>
</nav>

<div className="event-profile">M.CHA Administration</div>
</aside>

<main className="event-main">
<header className="event-header">
<div>
<h1>Event Booking Requests</h1>
<p>Review and manage private event inquiries.</p>
</div>

<button
className="event-primary"
onClick={() => setShowForm(true)}
>
+ NEW REQUEST
</button>
</header>

<section className="event-stats">
<div className="event-stat">
<small>TOTAL REQUESTS</small>
<h2>{requests.length}</h2>
</div>

<div className="event-stat">
<small>PENDING</small>
<h2>{pending}</h2>
</div>

<div className="event-stat">
<small>APPROVED</small>
<h2>{approved}</h2>
</div>

<div className="event-stat">
<small>DECLINED</small>
<h2>{declined}</h2>
</div>
</section>

<section className="event-panel">
<div className="event-panel-header">
<h2>Incoming Requests</h2>

<div className="event-filters">
{['All', 'Pending', 'Approved', 'Declined'].map((item) => (
<button
key={item}
className={filter === item ? 'selected' : ''}
onClick={() => setFilter(item)}
>
{item}
</button>
))}
</div>
</div>

<div className="event-request-list">
{filteredRequests.length === 0 && (
<p>No requests found.</p>
)}

{filteredRequests.map((request) => (
<article className="event-request" key={request.id}>
<div className="event-request-info">
<h3>{request.name}</h3>

<p>
{request.date} · {request.guests} guests · {request.type}
</p>

<p>{request.details}</p>

<span
className={`event-status ${request.status.toLowerCase()}`}
>
{request.status}
</span>
</div>

<div className="event-actions">
{request.status === 'Pending' && (
<>
<button
className="event-approve"
onClick={() => updateStatus(request.id, 'Approved')}
>
APPROVE
</button>

<button
className="event-decline"
onClick={() => updateStatus(request.id, 'Declined')}
>
DECLINE
</button>
</>
)}

<button
className="event-reply"
onClick={() => setSelectedRequest(request)}
>
DETAILS / REPLY
</button>
</div>
</article>
))}
</div>
</section>
</main>

{showForm && (
<div className="event-overlay">
<div className="event-modal">
<button
className="event-close"
onClick={() => setShowForm(false)}
>
×
</button>

<small>EVENT MANAGEMENT</small>
<h2>New event booking request</h2>

<form onSubmit={submitRequest}>
<label>
Event name
<input
required
value={form.name}
onChange={(e) =>
setForm({ ...form, name: e.target.value })
}
/>
</label>

<label>
Contact email
<input
type="email"
required
value={form.email}
onChange={(e) =>
setForm({ ...form, email: e.target.value })
}
/>
</label>

<div className="event-form-row">
<label>
Event date
<input
type="date"
required
value={form.date}
onChange={(e) =>
setForm({ ...form, date: e.target.value })
}
/>
</label>

<label>
Number of guests
<input
type="number"
min="1"
required
value={form.guests}
onChange={(e) =>
setForm({ ...form, guests: e.target.value })
}
/>
</label>
</div>

<label>
Event type
<select
value={form.type}
onChange={(e) =>
setForm({ ...form, type: e.target.value })
}
>
<option>Wedding</option>
<option>Corporate</option>
<option>Birthday</option>
<option>Private Event</option>
<option>Other</option>
</select>
</label>

<label>
Event details
<textarea
rows="4"
value={form.details}
onChange={(e) =>
setForm({ ...form, details: e.target.value })
}
/>
</label>

<div className="event-modal-actions">
<button
type="button"
onClick={() => setShowForm(false)}
>
CANCEL
</button>

<button type="submit" className="event-primary">
SUBMIT REQUEST
</button>
</div>
</form>
</div>
</div>
)}

{selectedRequest && (
<div className="event-overlay">
<div className="event-modal">
<button
className="event-close"
onClick={() => setSelectedRequest(null)}
>
×
</button>

<small>BOOKING DETAILS</small>
<h2>{selectedRequest.name}</h2>

<p><strong>Email:</strong> {selectedRequest.email}</p>
<p><strong>Date:</strong> {selectedRequest.date}</p>
<p><strong>Guests:</strong> {selectedRequest.guests}</p>
<p><strong>Type:</strong> {selectedRequest.type}</p>
<p><strong>Details:</strong> {selectedRequest.details}</p>

<div className="event-modal-actions">
<button onClick={() => setSelectedRequest(null)}>
CLOSE
</button>

<a
className="event-primary event-email-link"
href={`mailto:${selectedRequest.email}?subject=${encodeURIComponent(
`M.CHA Event Inquiry: ${selectedRequest.name}`
)}`}
>
REPLY BY EMAIL
</a>
</div>
</div>
</div>
)}
</div>
);
}

export default EventRequests;
