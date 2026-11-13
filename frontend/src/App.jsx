import Home from './pages/Home'
import Registration from './pages/Registration'
import Login from './pages/Login'
import AdminProducts from "./pages/AdminProducts";
import EventRequests from "./pages/EventRequests";
import EventBooking from "./pages/EventBooking";
import WhereAreWeToday from "./components/WhereAreWeToday";
import Shop from "./pages/ShopPage";
function App() {
const path = window.location.pathname.replace(/\/+$/, "") || "/";

if (path === "/register") {
return <Registration />;
}

if (path === "/login") {
return <Login />;
}

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

case "/shop":
case "/preview/shop":
return <Shop />;

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
