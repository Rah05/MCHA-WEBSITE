import Home from "./pages/Home";
import Registration from "./pages/Registration";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OrderHistory from "./pages/OrderHistory";
import OrderDetail from "./pages/OrderDetail";

import AdminProducts from "./pages/AdminProducts";
import EventRequests from "./pages/EventRequests";
import EventBooking from "./pages/EventBooking";
import WhereAreWeToday from "./components/WhereAreWeToday";
import Shop from "./pages/ShopPage";

function App() {
const path =
window.location.pathname.replace(/\/+$/, "") || "/";

switch (path) {
case "/":
return <Home />;

case "/register":
return <Registration />;

case "/login":
return <Login />;

case "/forgot-password":
return <ForgotPassword />;

case "/reset-password":
return <ResetPassword />;

case "/orders":
return <OrderHistory />;

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
if (path.startsWith("/orders/")) {
return <OrderDetail />;
}

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
