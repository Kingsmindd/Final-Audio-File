import { Outlet } from "react-router-dom";
import AccountSidebar from "../../components/AccountSidebar";
import Navbar from "../../components/Navbar";
import Cart from "../../components/Cart";

export default function AdminLayout() {
  return (
    <div className="admin-shell account-layout">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <AccountSidebar />
      <div className="account-layout-content">
        <Navbar />
        <main id="main-content" className="account-admin-main"><Outlet /></main>
      </div>
      <Cart />
    </div>
  );
}
