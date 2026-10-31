
import { useState } from "react";
import "./EventBooking.css";

const initialForm = {
name: "",
email: "",
date: "",
guests: "",
eventType: "",
details: "",
};

function EventBooking() {
const [form, setForm] = useState(initialForm);
const [booking, setBooking] = useState(null);
const [submitted, setSubmitted] = useState(false);

function handleChange(event) {
const { name, value } = event.target;

setForm((previous) => ({
...previous,
[name]: value,
}));
}

function handleSubmit(event) {
event.preventDefault();

const newBooking = {
...form,
id: `MCHA-${Date.now()}`,
status: "Pending",
};

setBooking(newBooking);
setSubmitted(true);
}

function handleNewRequest() {
setForm(initialForm);
setBooking(null);
setSubmitted(false);
}

return (
<div className="event-booking-page">
<header className="event-booking-header">
<div className="event-booking-logo">M.CHA</div>
<p>Matcha • Community • Experiences</p>
</header>

<main className="event-booking-container">
<div className="event-booking-intro">
<span className="event-booking-eyebrow">
EVENTS & EXPERIENCES
</span>

<h1>Book M.CHA for Your Event</h1>

<p>
Planning a celebration, gathering, or special
occasion? Tell us about your event and our team
will review your request.
</p>
</div>

{!submitted ? (
<form
className="event-booking-form"
onSubmit={handleSubmit}
>
<h2>Event Booking Request</h2>

<p className="event-booking-form-description">
Fill out the details below to preview your
event booking request.
</p>

<div className="event-booking-grid">
<div className="event-booking-field">
<label htmlFor="booking-name">
Full Name
</label>

<input
id="booking-name"
type="text"
name="name"
placeholder="Your full name"
value={form.name}
onChange={handleChange}
required
/>
</div>

<div className="event-booking-field">
<label htmlFor="booking-email">
Email Address
</label>

<input
id="booking-email"
type="email"
name="email"
placeholder="you@example.com"
value={form.email}
onChange={handleChange}
required
/>
</div>

<div className="event-booking-field">
<label htmlFor="booking-date">
Event Date
</label>

<input
id="booking-date"
type="date"
name="date"
min={new Date().toLocaleDateString("en-CA")}
value={form.date}
onChange={handleChange}
required
/>
</div>

<div className="event-booking-field">
<label htmlFor="booking-guests">
Estimated Guests
</label>

<input
id="booking-guests"
type="number"
name="guests"
min="1"
placeholder="Number of guests"
value={form.guests}
onChange={handleChange}
required
/>
</div>

<div className="event-booking-field event-booking-full">
<label htmlFor="booking-type">
Event Type
</label>

<select
id="booking-type"
name="eventType"
value={form.eventType}
onChange={handleChange}
required
>
<option value="">
Select an event type
</option>
<option value="Birthday Party">
Birthday Party
</option>
<option value="Corporate Event">
Corporate Event
</option>
<option value="Private Gathering">
Private Gathering
</option>
<option value="Pop-up Event">
Pop-up Event
</option>
<option value="Other">
Other
</option>
</select>
</div>

<div className="event-booking-field event-booking-full">
<label htmlFor="booking-details">
Additional Details
</label>

<textarea
id="booking-details"
name="details"
rows="5"
placeholder="Tell us about your event, preferred location, and any special requests..."
value={form.details}
onChange={handleChange}
/>
</div>
</div>

<button
type="submit"
className="event-booking-button"
>
Preview Request
</button>

<p className="event-booking-note">
This is a frontend preview. Your request
will not be sent to the M.CHA team yet.
</p>
</form>
) : (
<section className="event-booking-success">
<div className="event-booking-success-icon">
✓
</div>

<h2>Booking Request Preview</h2>

<p className="event-booking-success-description">
Here is how your event booking information
and request status will appear.
</p>

<div className="booking-status-card">
<div className="booking-status-heading">
<h3>Request Details</h3>

<span className="booking-status-badge">
{booking.status}
</span>
</div>

<div className="booking-detail">
<strong>Request ID</strong>
<span>{booking.id}</span>
</div>

<div className="booking-detail">
<strong>Full Name</strong>
<span>{booking.name}</span>
</div>

<div className="booking-detail">
<strong>Email</strong>
<span>{booking.email}</span>
</div>

<div className="booking-detail">
<strong>Event Date</strong>
<span>{booking.date}</span>
</div>

<div className="booking-detail">
<strong>Estimated Guests</strong>
<span>{booking.guests}</span>
</div>

<div className="booking-detail">
<strong>Event Type</strong>
<span>{booking.eventType}</span>
</div>

{booking.details && (
<div className="booking-detail">
<strong>Additional Details</strong>
<span>{booking.details}</span>
</div>
)}
</div>

<div className="booking-status-message">
<strong>Current Status: Pending</strong>

<p>
In the completed website, you will be
able to check whether your request has
been approved or declined by the M.CHA
team.
</p>
</div>

<button
type="button"
className="event-booking-button"
onClick={handleNewRequest}
>
Create Another Request
</button>
</section>
)}
</main>
</div>
);
}

export default EventBooking;

