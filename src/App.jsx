import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./lib/CartContext";
import CustomerTopBar from "./components/CustomerTopBar";

import MenuPage from "./pages/customer/MenuPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderStatusPage from "./pages/customer/OrderStatusPage";

import OwnerLoginPage from "./pages/owner/OwnerLoginPage";
import OwnerOrdersPage from "./pages/owner/OwnerOrdersPage";
import OwnerMenuPage from "./pages/owner/OwnerMenuPage";
import RequireOwner from "./pages/owner/RequireOwner";

function CustomerLayout({ children }) {
  return (
    <CartProvider>
      <CustomerTopBar />
      {children}
    </CartProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerLayout><MenuPage /></CustomerLayout>} />
        <Route path="/cart" element={<CustomerLayout><CartPage /></CustomerLayout>} />
        <Route path="/checkout" element={<CustomerLayout><CheckoutPage /></CustomerLayout>} />
        <Route path="/order/:orderId" element={<CustomerLayout><OrderStatusPage /></CustomerLayout>} />

        <Route path="/owner/login" element={<OwnerLoginPage />} />
        <Route
          path="/owner"
          element={
            <RequireOwner>
              <OwnerOrdersPage />
            </RequireOwner>
          }
        />
        <Route
          path="/owner/menu"
          element={
            <RequireOwner>
              <OwnerMenuPage />
            </RequireOwner>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
