import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
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
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const [account, setAccount] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setMenu(false);
    setAccount(false);
  }, [location.pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setAccount(false);
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
  return (
    <header className="site-header">
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
          onClick={() => setMenu(!menu)}
        >
          {menu ? <FiX /> : <FiMenu />}
        </button>
        <Link to="/" className="wordmark" aria-label="Audiophile home">
          audiophile<span>.</span>
        </Link>
        <div className="desktop-links">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}>
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
              onClick={() => setAccount(!account)}
            >
              {user ? (
                <span className="avatar-initial">{user.name.charAt(0)}</span>
              ) : (
                <FiUser />
              )}
            </button>
            {account && (
              <div className="account-menu" id="account-menu">
                {user ? (
                  <>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                    {user.isAdmin && (
                      <Link to="/admin">
                        Admin dashboard <FiArrowUpRight />
                      </Link>
                    )}
                    <Link to="/profile">My profile</Link>
                    <Link to="/orders">My orders</Link>
                    <button
                      onClick={() => {
                        logout();
                        setAccount(false);
                        navigate("/");
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <strong>Your listening journey</strong>
                    <Link to="/login">
                      Sign in <FiArrowUpRight />
                    </Link>
                    <Link to="/register">Create an account</Link>
                  </>
                )}
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
        <div id="mobile-navigation" className="mobile-links shell">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}>
              {l.label}
              <FiArrowUpRight />
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
