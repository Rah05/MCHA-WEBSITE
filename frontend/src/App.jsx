import Home from "./pages/Home";
import AdminProducts from "./pages/AdminProducts";
import EventRequests from "./pages/EventRequests";
import EventBooking from "./pages/EventBooking";

function App() {
const path = window.location.pathname.replace(/\/+$/, "") || "/";

switch (path) {
case "/":
return <Home />;

case "/admin/products":
return <AdminProducts />;

case "/admin/events":
return <EventRequests />;

case "/events/book":
return <EventBooking />;

default:
return (
<div style={{ padding: "40px", textAlign: "center" }}>
<h1>Page Not Found</h1>
<p>The page you requested does not exist.</p>
<a href="/">Return to Home</a>
</div>
);
}
}

export default App;