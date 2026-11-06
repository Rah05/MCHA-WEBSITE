import { useState } from "react";
import "./WhereAreWeToday.css";

// Temporary data until the backend provides confirmed locations.
// Do not treat this as a real scheduled M.CHA event.
const fallbackLocation = {
id: "pending",
name: "Location to be announced",
address: "",
date: "Coming soon",
hours: "To be announced",
status: "upcoming",
description:
"Our next pop-up location and hours have not been announced yet. Check back for updates.",
};

function normalizeLocation(location) {
return {
...fallbackLocation,
...(location || {}),
};
}

function getStatusText(status) {
switch (status) {
case "open":
return "Currently open";
case "closed":
return "Currently closed";
case "upcoming":
return "Upcoming pop-up";
case "cancelled":
return "Pop-up cancelled";
default:
return "Location information";
}
}

export default function WhereAreWeToday({
location,
locations,
}) {
const [showDetails, setShowDetails] = useState(false);

const availableLocations =
Array.isArray(locations) && locations.length > 0
? locations
: [location || fallbackLocation];

const [selectedId, setSelectedId] = useState(null);

const selectedLocation =
availableLocations.find(
(item) => String(item.id) === String(selectedId)
) || availableLocations[0];

const current = normalizeLocation(selectedLocation);

const hasAddress = Boolean(current.address?.trim());

const mapUrl = hasAddress
? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
current.address
)}`
: null;

const statusText = getStatusText(current.status);

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
current.status === "open" ? "is-open" : ""
}`}
/>
{statusText}
</div>

{availableLocations.length > 1 && (
<div className="mcha-where__selector">
<label htmlFor="mcha-location-select">
Select a pop-up
</label>

<select
id="mcha-location-select"
value={String(selectedLocation.id)}
onChange={(event) => {
setSelectedId(event.target.value);
setShowDetails(false);
}}
>
{availableLocations.map((item) => (
<option
key={item.id}
value={String(item.id)}
>
{item.name}
</option>
))}
</select>
</div>
)}

<div className="mcha-where__card">
<div className="mcha-where__card-heading">
<span
className="mcha-where__card-icon"
aria-hidden="true"
>
📍
</span>

<div>
<span className="mcha-where__label">
OUR LOCATION
</span>

<h3>{current.name}</h3>
</div>
</div>

<p className="mcha-where__address">
{hasAddress
? current.address
: "Check back for our next pop-up location."}
</p>

<div className="mcha-where__facts">
<div>
<span className="mcha-where__label">
DATE
</span>
<strong>{current.date}</strong>
</div>

<div>
<span className="mcha-where__label">
HOURS
</span>
<strong>{current.hours}</strong>
</div>
</div>

{showDetails && (
<div className="mcha-where__extra">
<p>{current.description}</p>

<p>
<strong>Status:</strong> {statusText}
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
onClick={() => setShowDetails((prev) => !prev)}
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
