import { useState } from "react";
import "./WhereAreWeToday.css";

// Temporary example information.
// Replace with confirmed M.CHA pop-up details or an API response.
const initialLocation = {
name: "Location to be announced",
address: "Check back for our next pop-up location.",
date: "Coming soon",
hours: "To be announced",
status: "upcoming",
};

export default function WhereAreWeToday({
location = initialLocation,
}) {
const [showDetails, setShowDetails] = useState(false);

const hasAddress =
location.address &&
location.address !== initialLocation.address;

const mapUrl = hasAddress
? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
location.address
)}`
: null;

return (
<section
className="mcha-where"
aria-labelledby="mcha-where-title"
>
<div className="mcha-where__inner">
<div className="mcha-where__copy">
<span className="mcha-where__eyebrow">
M.CHA • POP-UP UPDATES
</span>

<h2 id="mcha-where-title">
Where are we <em>today?</em>
</h2>

<p className="mcha-where__intro">
Follow the matcha. Find our latest pop-up
location, hours, and upcoming appearances.
</p>

<div className="mcha-where__status">
<span
className={`mcha-where__dot ${
location.status === "open" ? "is-open" : ""
}`}
/>
{location.status === "open"
? "Pop-up currently open"
: "Next pop-up information"}
</div>

<div className="mcha-where__card">
<div className="mcha-where__card-heading">
<span className="mcha-where__card-icon">
📍
</span>

<div>
<span className="mcha-where__label">
OUR LOCATION
</span>
<h3>{location.name}</h3>
</div>
</div>

<p className="mcha-where__address">
{location.address}
</p>

<div className="mcha-where__facts">
<div>
<span className="mcha-where__label">
DATE
</span>
<strong>{location.date}</strong>
</div>

<div>
<span className="mcha-where__label">
HOURS
</span>
<strong>{location.hours}</strong>
</div>
</div>

{showDetails && (
<div className="mcha-where__extra">
<p>
We're excited to serve you freshly
prepared matcha. Watch this space
for confirmed pop-up announcements.
</p>

{mapUrl && (
<a
href={mapUrl}
target="_blank"
rel="noopener noreferrer"
>
Open location in Google Maps
</a>
)}
</div>
)}

<button
type="button"
className="mcha-where__details-button"
onClick={() => setShowDetails(!showDetails)}
aria-expanded={showDetails}
>
{showDetails
? "Hide Details"
: "View Pop-up Details"}
<span aria-hidden="true">
{showDetails ? "−" : "+"}
</span>
</button>
</div>
</div>

<div className="mcha-where__visual">
<div className="mcha-where__visual-circle">
<div className="mcha-where__cup">
<div className="mcha-where__cup-top" />
<div className="mcha-where__cup-body">
<span>M.CHA</span>
</div>
<div className="mcha-where__cup-shadow" />
</div>
</div>

<div className="mcha-where__visual-caption">
<span>FRESH MATCHA</span>
<span>WHEREVER WE GO</span>
</div>
</div>
</div>
</section>
);
}
