import Home from "./pages/Home";
import AdminProducts from "./pages/AdminProducts";
import EventRequests from "./pages/EventRequests";
import EventBooking from "./pages/EventBooking";
import WhereAreWeToday from "./components/WhereAreWeToday";

function App() {
const path =
window.location.pathname.replace(/\/+$/, "") || "/";

switch (path) {
case "/":
return <Home />;

case "/admin/products":
return <AdminProducts />;

case "/admin/events":
return <EventRequests />;

case "/events/book":
return <EventBooking />;

case "/preview/location-banner":
return <WhereAreWeToday />;

default:
return (
<main style={{ padding: 40, textAlign: "center" }}>
<h1>Page Not Found</h1>
<p>The page you requested does not exist.</p>
<a href="/">Return to Home</a>
</main>
);
}
}

export default App;
