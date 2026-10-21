// ============================================================
// pages/OrderHistoryPage.tsx
// Shows all past orders for the logged-in user.
// Protected route — only accessible when logged in.
// ============================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Order } from "../types";
import api from "../Services/api";
import RollerLoader from "../components/RollerLoader";

// Status badge color mapping
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch user's orders on mount
  useEffect(() => {
    const fetchOrders = async (): Promise<void> => {
      try {
        // GET /api/orders/my-orders — requires JWT token (added by Axios interceptor)
        const { data } = await api.get<Order[]>("/orders/my-orders");
        setOrders(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <RollerLoader />;

  return (
    <div className="account-page bg-[#F1F1F1] min-h-screen py-12 animate-[fadeIn_0.4s_ease-in]">
      <div className=" px-6 sm:px-[clamp(1rem,11.46vw,200px)]">
        <h1 className="font-bold text-[28px] md:text-[32px] tracking-[1.14px] uppercase text-black mb-8">
          My Orders
        </h1>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!error && orders.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-5xl mb-4">📦</p>
            <h2 className="font-bold text-xl text-black mb-2">No orders yet</h2>
            <p className="text-black/50 text-sm mb-8">
              Looks like you haven't placed any orders. Start shopping!
            </p>
            <Link
              to="/"
              className=" bg-[#D87D4A] text-white font-bold text-[13px] tracking-[1px] uppercase py-4 px-8 hover:bg-[#FBAF85] transition-colors cursor-pointer duration-200 disabled:opacity-60 py-4 disabled:opacity-60 inline-block py-4 px-8"
            >
              Shop Now
            </Link>
          </div>
        )}

        {/* Orders list */}
        {orders.length > 0 && (
          <div className="flex flex-col gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm"
              >
                {/* Order header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-black/50 uppercase tracking-wide mb-1">
                      Order ID
                    </p>
                    <p className="font-bold text-sm text-black">
                      {order.orderId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-black/50 uppercase tracking-wide mb-1">
                      Date
                    </p>
                    <p className="font-bold text-sm text-black">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-black/50 uppercase tracking-wide mb-1">
                      Total
                    </p>
                    <p className="font-bold text-sm text-black">
                      $ {order.orderSummary.grandTotal.toLocaleString()}
                    </p>
                  </div>
                  {/* Status badge */}
                  <span
                    className={`
                      inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                      ${statusColors[order.status] || "bg-gray-100 text-gray-700"}
                    `}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Order items */}
                <div className="flex flex-col gap-4">
                  {order.cartItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#F1F1F1] rounded-xl flex items-center justify-center flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-9 h-9 object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-black truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-black/50">
                          ₦ {item.price.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-sm text-black flex-shrink-0">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Order summary footer */}
                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col md:flex-row md:justify-between gap-4">
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between md:gap-16">
                      <span className="text-black/50">Subtotal:</span>
                      <span className="font-bold">
                        ₦ {order.orderSummary.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/50">Shipping:</span>
                      <span className="font-bold">
                        ₦ {order.orderSummary.shipping.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/50">VAT:</span>
                      <span className="font-bold">
                        ₦ {order.orderSummary.vat.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-black/50 uppercase">
                        Grand Total
                      </p>
                      <p className="font-bold text-xl text-[#D87D4A]">
                        ₦ {order.orderSummary.grandTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
