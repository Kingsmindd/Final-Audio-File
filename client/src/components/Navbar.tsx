import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  FiArrowUpRight,
  FiMenu,
  FiShoppingBag,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useStore } from "../context/StoreContext";
import { useAuth } from "../context/AuthContext";
const links = [
  { to: "/", label: "Home" },
  { to: "/headphones", label: "Headphones" },
  { to: "/speakers", label: "Speakers" },
  { to: "/earphones", label: "Earphones" },
];
export default function Navbar() {
  const { cart, setIsCartOpen } = useStore();
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const [account, setAccount] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const [menuPath, setMenuPath] = useState(location.pathname);
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setMenu(false);
    setAccount(false);
  }
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAccount(false);
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMenu(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setAccount(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", key);
      return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", key);
    };
  }, []);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (user) {
    return (
      <header className="member-header">
        <nav aria-label="Shopping bag">
          <button className="member-cart-button" aria-label={"Open shopping bag, " + count + " items"} onClick={() => setIsCartOpen(true)}>
            <FiShoppingBag aria-hidden="true" /><span>Cart</span>{count > 0 && <span className="bag-count">{count}</span>}
          </button>
        </nav>
      </header>
    );
  }

  return (
    <header ref={headerRef} className="site-header">
      <div className="announcement">
        A little closer to the music.{" "}
        <span>
          Discover your next favourite sound <FiArrowUpRight />
        </span>
      </div>
      <nav className="shell nav-inner" aria-label="Main navigation">
        <button
          className="icon-button menu-toggle"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          aria-controls="mobile-navigation"
          onClick={() => { setMenu(!menu); setAccount(false); }}
        >
          {menu ? <FiX /> : <FiMenu />}
        </button>
        <Link to="/" className="wordmark" aria-label="Audiophile home">
          audiophile<span>.</span>
        </Link>
        <div className="desktop-links">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setMenu(false)}>
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="nav-actions">
          <div ref={ref} className="account-wrap">
            <button
              className="icon-button"
              aria-label="Account menu"
              aria-expanded={account}
              aria-controls="account-menu"
              onClick={() => { setAccount(!account); setMenu(false); }}
            >
              <FiUser />
            </button>
            {account && (
              <div className="account-menu" id="account-menu">
                <strong>Your listening journey</strong>
                <Link to="/login">Sign in <FiArrowUpRight /></Link>
                <Link to="/register">Create an account</Link>
              </div>
            )}
          </div>
          <span className="nav-divider" />
          <button
            className="icon-button bag-button"
            aria-label={"Open shopping bag, " + count + " items"}
            onClick={() => {
              setAccount(false);
              setIsCartOpen(true);
            }}
          >
            <FiShoppingBag />
            {count > 0 && <span className="bag-count">{count}</span>}
          </button>
        </div>
      </nav>
      {menu && (
        <div id="mobile-navigation" className="mobile-links" aria-label="Browse the store">
          <div className="guest-mobile-scroll" tabIndex={0}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setMenu(false)}>
              {l.label}
              <FiArrowUpRight />
            </NavLink>
          ))}
          </div>
        </div>
      )}
    </header>
  );
}



