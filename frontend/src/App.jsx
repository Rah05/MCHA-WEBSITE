
import Home from "./pages/Home";
import Registration from "./pages/Registration";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OrderHistory from "./pages/OrderHistory";
import OrderDetail from "./pages/OrderDetail";
import WholesaleInquiry from './pages/WholesaleInquiry'

import AdminProducts from "./pages/AdminProducts";
import EventRequests from "./pages/EventRequests";
import EventBooking from "./pages/EventBooking";
import WhereAreWeToday from "./components/WhereAreWeToday";
import Shop from "./pages/ShopPage";

function App() {
const path = window.location.pathname.replace(/\/+$/, "") || "/";

if (path === "/register") return <Registration />;
if (path === "/login") return <Login />;
if (path === "/forgot-password") return <ForgotPassword />;
if (path === "/reset-password") return <ResetPassword />;

if (path === "/orders") return <OrderHistory />;
if (path.startsWith("/orders/")) return <OrderDetail />;

if (path === "/admin/products") return <AdminProducts />;
if (path === "/admin/events") return <EventRequests />;
if (path === "/events/book") return <EventBooking />;

if (path === "/preview/location-banner") return <WhereAreWeToday />;

if (path === "/shop" || path === "/preview/shop") {
return <Shop />;
}

if (path === '/wholesale/inquiry') {
    return <WholesaleInquiry />
}

return <Home />;
}

export default App;
