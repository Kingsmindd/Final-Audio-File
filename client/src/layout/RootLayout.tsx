import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Cart from "../components/Cart";
import { useStore } from "../context/StoreContext";
export default function RootLayout(){const {pathname}=useLocation();const {refreshProducts}=useStore();useEffect(()=>{void refreshProducts();},[refreshProducts]);useEffect(()=>{window.scrollTo(0,0);},[pathname]);return <><a className="skip-link" href="#main-content">Skip to content</a><Navbar/><main id="main-content"><Outlet/></main><Footer/><Cart/></>;}
