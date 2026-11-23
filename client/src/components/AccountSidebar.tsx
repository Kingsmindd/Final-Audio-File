import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiArrowUpRight, FiBox, FiGrid, FiHeadphones, FiHome, FiLogOut, FiMenu, FiPackage, FiShoppingBag, FiSliders, FiUser, FiUsers, FiVolume2, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "./AccountSidebar.css";

const shoppingLinks = [
  { to: "/", label: "Home", icon: FiHome, end: true },
  { to: "/headphones", label: "Headphones", icon: FiHeadphones },
  { to: "/speakers", label: "Speakers", icon: FiVolume2 },
  { to: "/earphones", label: "Earphones", icon: FiSliders },
];
const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: FiGrid, end: true },
  { to: "/admin/products", label: "Manage products", icon: FiBox },
  { to: "/admin/orders", label: "Manage orders", icon: FiPackage },
  { to: "/admin/users", label: "Manage customers", icon: FiUsers },
];

export default function AccountSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const dropdown = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!dropdown.current?.contains(target) && !toggle.current?.contains(target)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const resize = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", key);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", key);
      desktop.removeEventListener("change", resize);
    };
  }, [open]);

  if (!user) return null;

  const section = (title: string, items: typeof shoppingLinks) => (
    <div className="account-sidebar-group">
      <p>{title}</p>
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
          <Icon aria-hidden="true" /><span>{label}</span><FiArrowUpRight className="account-nav-arrow" aria-hidden="true" />
        </NavLink>
      ))}
    </div>
  );
  const content = (
    <>
      <div className="account-sidebar-brand">
        <Link to="/" className="wordmark" onClick={() => setOpen(false)}>audiophile<span>.</span></Link>
        <span>{user.isAdmin ? "Store management" : "Your listening space"}</span>
      </div>
      <div className="account-sidebar-identity">
        {user.avatar ? <img src={user.avatar} alt="" /> : <span className="account-sidebar-avatar">{user.name.charAt(0).toUpperCase()}</span>}
        <div><strong>{user.name}</strong><span title={user.email}>{user.email}</span><small>{user.isAdmin ? "Administrator" : "Member"}</small></div>
      </div>
      <nav className="account-sidebar-navigation" aria-label={user.isAdmin ? "Store and admin navigation" : "Your account navigation"}>
        {user.isAdmin && section("Management", adminLinks)}
        {section("Explore", shoppingLinks)}
        {section("Your account", [
          { to: "/orders", label: "My orders", icon: FiShoppingBag },
          { to: "/profile", label: "Profile & settings", icon: FiUser },
        ])}
      </nav>
      <div className="account-sidebar-bottom">
        <button onClick={() => { setOpen(false); logout(); navigate("/login", { replace: true }); }}><FiLogOut aria-hidden="true" /><span>Sign out</span><FiArrowUpRight aria-hidden="true" /></button>
      </div>
    </>
  );

  return (
    <>
      <aside className="account-sidebar-desktop">{content}</aside>
      <button ref={toggle} className="account-sidebar-toggle" aria-label={open ? "Close account navigation" : "Open account navigation"} aria-expanded={open} aria-controls="account-navigation-dropdown" onClick={() => setOpen(value => !value)}>{open ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}</button>
      {open && <div id="account-navigation-dropdown" className="account-mobile-dropdown" ref={dropdown}><div className="account-mobile-scroll" tabIndex={0} aria-label="Scrollable account links">{content}</div><p className="account-mobile-scroll-hint">Scroll for more options <span aria-hidden="true">↓</span></p></div>}
    </>
  );
}
