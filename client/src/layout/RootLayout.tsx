import React from "react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import Cart from "../components/Cart";

const RootLayout: React.FC = () => {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet />
      </main>

      <Footer />

      <Cart />
    </div>
  );
};

export default RootLayout;
