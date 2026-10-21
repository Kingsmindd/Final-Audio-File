// ============================================================
// pages/admin/AdminDashboard.tsx
// The main admin dashboard with:
// - 4 stat cards (Total Orders, Revenue, Users, Pending)
// - Monthly revenue chart (simple bar chart using CSS)
// - Recent orders table
// ============================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MdShoppingBag,
  MdAttachMoney,
  MdPeople,
  MdPending,
} from "react-icons/md";
import type { DashboardStats } from "../../types";
import api from "../../Services/api";
import RollerLoader from "../../components/RollerLoader";

// Month names for chart labels
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Status badge colors
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        // GET /api/admin/stats — requires admin JWT
        const { data } = await api.get<DashboardStats>("/admin/stats");
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <RollerLoader />;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Find max revenue for chart bar height scaling
  const maxRevenue = Math.max(
    ...stats.monthlyRevenue.map((m) => m.revenue),
    1, // Prevent division by zero
  );

  // Stat cards data
  const statCards = [
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: MdShoppingBag,
      color: "bg-[#D87D4A]",
    },
    {
      label: "Total order value",
      value: `₦ ${stats.totalRevenue.toLocaleString()}`,
      icon: MdAttachMoney,
      color: "bg-black",
    },
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: MdPeople,
      color: "bg-[#4C4C4C]",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders.toLocaleString(),
      icon: MdPending,
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="p-6 md:p-8 lg:p-10 animate-[fadeIn_0.4s_ease-in]">
      <h1 className="font-bold text-2xl md:text-3xl text-black mb-8">
        Dashboard
      </h1>

      {/* ---- Stat Cards ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4"
          >
            <div
              className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}
            >
              <Icon className="text-white text-2xl" />
            </div>
            <div>
              <p className="text-xs text-black/50 uppercase tracking-wider font-medium">
                {label}
              </p>
              <p className="font-bold text-2xl text-black mt-1">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Revenue Chart ---- */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="font-bold text-lg text-black mb-6">Monthly order value</h2>

          {stats.monthlyRevenue.length === 0 ? (
            <p className="text-black/40 text-sm text-center py-12">
              No order value data yet
            </p>
          ) : (
            <div className="flex items-end gap-2 md:gap-3 h-48">
              {stats.monthlyRevenue.map((month) => {
                // Calculate bar height as percentage of max revenue
                const heightPercent = (month.revenue / maxRevenue) * 100;
                const monthName = MONTHS[month._id.month - 1];

                return (
                  <div
                    key={`${month._id.year}-${month._id.month}`}
                    className="flex-1 h-full flex flex-col items-center gap-2"
                  >
                    {/* Revenue label on hover */}
                    <div className="group relative flex-1 flex items-end w-full">
                      <div
                        className="w-full bg-[#D87D4A] rounded-t-lg hover:bg-[#FBAF85] transition-colors cursor-pointer"
                        style={{
                          height: `${heightPercent}%`,
                          minHeight: "4px",
                        }}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ₦ {month.revenue.toLocaleString()}
                      </div>
                    </div>
                    {/* Month label */}
                    <span className="text-xs text-black/50 font-medium">
                      {monthName}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ---- Quick Stats ---- */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="font-bold text-lg text-black mb-6">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <Link
              to="/admin/products"
              className="flex items-center justify-between p-4 bg-[#F8F8F8] rounded-xl hover:bg-[#D87D4A] hover:text-white group transition-colors"
            >
              <span className="font-bold text-sm">Manage Products</span>
              <span className="text-lg">→</span>
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center justify-between p-4 bg-[#F8F8F8] rounded-xl hover:bg-[#D87D4A] hover:text-white group transition-colors"
            >
              <span className="font-bold text-sm">View All Orders</span>
              <span className="text-lg">→</span>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-4 bg-[#F8F8F8] rounded-xl hover:bg-[#D87D4A] hover:text-white group transition-colors"
            >
              <span className="font-bold text-sm">Manage Users</span>
              <span className="text-lg">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ---- Recent Orders Table ---- */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-black">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-sm text-[#D87D4A] font-bold hover:text-[#FBAF85] transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* Table — scrollable on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                {[
                  "Order ID",
                  "Customer",
                  "Items",
                  "Total",
                  "Status",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-xs font-bold text-black/50 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-black/40 text-sm"
                  >
                    No orders yet
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-black">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {order.customerInfo.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {order.cartItems.reduce((a, i) => a + i.quantity, 0)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-black">
                      ₦ {order.orderSummary.grandTotal.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          statusColors[order.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-black/50">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
