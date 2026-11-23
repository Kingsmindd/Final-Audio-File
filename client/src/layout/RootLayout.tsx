import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Cart from "../components/Cart";
import AccountSidebar from "../components/AccountSidebar";
import { useAuth } from "../context/AuthContext";

export default function RootLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className={user ? "account-layout" : undefined}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {user && <AccountSidebar />}
      <div className={user ? "account-layout-content" : undefined}>
        <Navbar />
        <main id="main-content"><Outlet /></main>
        <Footer />
      </div>
      <Cart />
    </div>
  );
}
