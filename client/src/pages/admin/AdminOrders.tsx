// ============================================================
// pages/admin/AdminOrders.tsx
// View and manage all customer orders.
// Admins can update order status (pending → processing → shipped → delivered).
// ============================================================

import React, { useState, useEffect } from "react";
import type { Order } from "../../types";
import api from "../../Services/api";
import toast from "react-hot-toast";

// All possible order statuses — in logical progression order
const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

// Badge colors per status
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (): Promise<void> => {
    try {
      // GET /api/admin/orders
      const { data } = await api.get<Order[]>("/admin/orders");
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Update the status of an order
  const handleStatusUpdate = async (
    orderId: string,
    newStatus: string,
  ): Promise<void> => {
    try {
      // PUT /api/admin/orders/:id/status
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });

      // Optimistically update the local state (faster UX than re-fetching)
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? { ...o, status: newStatus as Order["status"] }
            : o,
        ),
      );

      toast.success(`Order status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Filter orders by status
  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="p-6 md:p-8 lg:p-10 animate-[fadeIn_0.4s_ease-in]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="font-bold text-2xl md:text-3xl text-black">
          Orders{" "}
          <span className="text-black/30 text-xl font-normal">
            ({filteredOrders.length})
          </span>
        </h1>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {["all", ...ORDER_STATUSES].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
                filterStatus === status
                  ? "bg-[#D87D4A] text-white"
                  : "bg-white text-black/50 hover:bg-gray-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-black/40">
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-black/40">
          No orders{" "}
          {filterStatus !== "all" ? `with status "${filterStatus}"` : "yet"}.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order._id;

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Order header row */}
                <div
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedOrder(isExpanded ? null : order._id)
                  }
                >
                  {/* Left: Order info */}
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <p className="text-xs text-black/40 uppercase tracking-wide">
                        Order ID
                      </p>
                      <p className="font-bold text-sm text-black">
                        {order.orderId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-black/40 uppercase tracking-wide">
                        Customer
                      </p>
                      <p className="font-bold text-sm text-black">
                        {order.customerInfo.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-black/40 uppercase tracking-wide">
                        Date
                      </p>
                      <p className="font-bold text-sm text-black">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-black/40 uppercase tracking-wide">
                        Total
                      </p>
                      <p className="font-bold text-sm text-black">
                        ₦ {order.orderSummary.grandTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status + expand toggle */}
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        statusColors[order.status] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-black/30 text-xl">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Expanded: order details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-6 animate-[fadeIn_0.4s_ease-in]n">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Customer Info */}
                      <div>
                        <h3 className="text-xs font-bold text-[#D87D4A] uppercase tracking-wider mb-4">
                          Customer Details
                        </h3>
                        <div className="flex flex-col gap-2 text-sm">
                          {[
                            ["Name", order.customerInfo.name],
                            ["Email", order.customerInfo.email],
                            ["Phone", order.customerInfo.phone],
                            ["Address", order.customerInfo.address],
                            ["City", order.customerInfo.city],
                            ["ZIP", order.customerInfo.zipCode],
                            ["Country", order.customerInfo.country],
                            ["Payment", order.customerInfo.paymentMethod],
                          ].map(([label, value]) => (
                            <div key={label} className="flex gap-4">
                              <span className="text-black/40 w-20 shrink-0">
                                {label}:
                              </span>
                              <span className="font-medium text-black">
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <h3 className="text-xs font-bold text-[#D87D4A] uppercase tracking-wider mb-4">
                          Items Ordered
                        </h3>
                        <div className="flex flex-col gap-3">
                          {order.cartItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#F1F1F1] rounded-lg flex items-center justify-center shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-6 h-6 object-contain"
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs text-black truncate">
                                  {item.name}
                                </p>
                                <p className="text-xs text-black/50">
                                  ₦ {item.price.toLocaleString()} x{" "}
                                  {item.quantity}
                                </p>
                              </div>
                              <p className="font-bold text-xs text-black">
                                ${(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          ))}

                          {/* Summary */}
                          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1 text-xs">
                            {[
                              ["Subtotal", order.orderSummary.subtotal],
                              ["Shipping", order.orderSummary.shipping],
                              ["VAT", order.orderSummary.vat],
                            ].map(([label, value]) => (
                              <div
                                key={label as string}
                                className="flex justify-between"
                              >
                                <span className="text-black/50">{label}</span>
                                <span className="font-bold">
                                  ${(value as number).toLocaleString()}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between font-bold text-sm text-[#D87D4A] mt-1">
                              <span>Grand Total</span>
                              <span>
                                $
                                {order.orderSummary.grandTotal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status update controls */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <p className="text-xs font-bold text-black/50 uppercase tracking-wider mb-3">
                        Update Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ORDER_STATUSES.map((status) => (
                          <button
                            key={status}
                            onClick={() =>
                              handleStatusUpdate(order._id, status)
                            }
                            disabled={order.status === status}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              order.status === status
                                ? "bg-[#D87D4A] text-white"
                                : "bg-gray-100 text-black hover:bg-gray-200"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
