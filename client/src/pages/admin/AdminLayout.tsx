// ============================================================
// pages/admin/AdminLayout.tsx
// The shell/wrapper for all admin pages.
// Has a persistent sidebar on desktop and a top nav on mobile.
// All admin routes render inside the <Outlet />.
// ============================================================

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  MdDashboard,
  MdInventory,
  MdShoppingBag,
  MdPeople,
  MdLogout,
  MdMenu,
  MdStorefront,
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

// Sidebar navigation items
const navItems = [
  { to: "/admin", label: "Dashboard", icon: MdDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: MdInventory, end: false },
  { to: "/admin/orders", label: "Orders", icon: MdShoppingBag, end: false },
  { to: "/admin/users", label: "Users", icon: MdPeople, end: false },
];

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const handleLogout = (): void => {
    logout();
    navigate("/");
  };

  // Sidebar content — reused for both mobile overlay and desktop sidebar
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand header */}
      <div className="px-6 py-8 border-b border-white/10">
        <Link to="/" className="block">
          <span className="font-bold text-lg tracking-[6px] text-white">
            audiophile
          </span>
        </Link>
        <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">
          Admin Panel
        </p>
      </div>

      {/* Admin user info */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#D87D4A] flex items-center justify-center overflow-hidden shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-sm font-bold">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-white/50 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-[#D87D4A] text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`
            }
          >
            <Icon className="text-lg shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-4 py-6 border-t border-white/10 flex flex-col gap-2">
        <Link
          to="/"
          className="admin-view-store"
        >
          <MdStorefront aria-hidden="true" />
          View Store
          <span aria-hidden="true">↗</span>
        </Link>
        <button
          onClick={handleLogout}
          className="admin-button admin-button--sidebar flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors w-full text-left"
        >
          <MdLogout className="text-lg" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-shell flex h-screen bg-[#F8F8F8] overflow-hidden">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden lg:flex w-64 bg-[#1A1A1A] flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* ===== Mobile Sidebar Overlay ===== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar panel */}
          <aside className="relative w-64 bg-[#1A1A1A] flex flex-col z-10 animate-[slideDown_0.3s_ease-out]">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="admin-button admin-button--sidebar text-gray-600 text-2xl"
            aria-label="Open menu"
          >
            <MdMenu />
          </button>
          <span className="font-bold tracking-[4px] text-black text-sm">
            ADMIN
          </span>
          <div className="w-8 h-8 rounded-full bg-[#D87D4A] flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
