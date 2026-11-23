// Handle all order  operations:
// - createOrder (anyone)
//- getUserOrder (logged-in user sees their own orders)
//- getOrderById (user sees their order, admin sees any)
//- getAllOrders (admin only)
//- updateOrderStatus (admin only)
//- getDashboardstats (admin only)

import { createHash } from "node:crypto";
import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../types/indexServer";
import Order from "../models/Order";
import Product from "../models/Product";
import { validateCheckout } from "../validation/checkout";

//--- CREATE ORDER ----
// POST /api/orders
// Anyone (logged in or guest) can place an order

function publicOrder(order: InstanceType<typeof Order>) {
  const { idempotencyKey, requestFingerprint, ...result } = order.toObject();
  return result;
}

export const createOrder = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  let idempotencyKey: string | undefined;
  let requestFingerprint: string | undefined;
  try {
    const input = validateCheckout(req.body);
    if (!input.ok) {
      res.status(400).json({ message: input.message });
      return;
    }
    const rawKey = req.get("Idempotency-Key");
    if (
      !rawKey ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
        rawKey,
      )
    ) {
      res
        .status(400)
        .json({
          message:
            "A valid checkout request key is required. Refresh checkout and try again",
        });
      return;
    }
    const { customerInfo } = input;
    const cartItems = [...input.cartItems].sort((a, b) =>
      a._id.localeCompare(b._id),
    );
    idempotencyKey = createHash("sha256")
      .update(
        (req.user?._id.toString() ?? "guest") + ":" + rawKey.toLowerCase(),
      )
      .digest("hex");
    requestFingerprint = createHash("sha256")
      .update(JSON.stringify({ customerInfo, cartItems }))
      .digest("hex");
    const existing = await Order.findOne({ idempotencyKey }).select(
      "+requestFingerprint",
    );
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) {
        res
          .status(409)
          .json({
            message:
              "This checkout key was already used with different details",
            code: "IDEMPOTENCY_CONFLICT",
          });
        return;
      }
      res.status(200).json(publicOrder(existing));
      return;
    }
    const products = await Product.find({
      _id: { $in: cartItems.map((item) => item._id) },
    });
    const byId = new Map(
      products.map((product) => [product._id.toString(), product]),
    );
    if (cartItems.some((item) => !byId.has(item._id))) {
      res
        .status(400)
        .json({ message: "One or more products are no longer available" });
      return;
    }
    const subtotal = cartItems.reduce(
      (sum, item) => sum + byId.get(item._id)!.price * item.quantity,
      0,
    );
    const shipping = 50;
    const vat = Math.round(subtotal * 0.075);
    const grandTotal = subtotal + shipping + vat;
    if (
      !Number.isFinite(grandTotal) ||
      grandTotal < 0 ||
      grandTotal > Number.MAX_SAFE_INTEGER
    ) {
      res
        .status(400)
        .json({ message: "The order amount is outside the supported range" });
      return;
    }
    const order = await Order.create({
      idempotencyKey,
      requestFingerprint,
      customerInfo,
      cartItems: cartItems.map((item) => {
        const product = byId.get(item._id)!;
        return {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.image.trim(),
        };
      }),
      orderSummary: { subtotal, shipping, vat, grandTotal },
      ...(req.user ? { userId: req.user._id } : {}),
    });
    res.status(201).json(publicOrder(order));
  } catch (error: unknown) {
    if ((error as { code?: number })?.code === 11000 && idempotencyKey) {
      // A concurrent request won the unique-index race. Replay its result.
      try {
        const existing = await Order.findOne({ idempotencyKey }).select(
          "+requestFingerprint",
        );
        if (existing && existing.requestFingerprint === requestFingerprint) {
          res.status(200).json(publicOrder(existing));
          return;
        }
        res
          .status(409)
          .json({
            message:
              "Checkout request conflict. Review your details before trying again",
            code: "IDEMPOTENCY_CONFLICT",
          });
        return;
      } catch {
        /* Return a retryable server error below. */
      }
    }
    if (
      error instanceof mongoose.Error.ValidationError ||
      error instanceof mongoose.Error.CastError
    ) {
      res
        .status(400)
        .json({ message: "Please check the order details and try again" });
      return;
    }
    console.error("Create order failed:", error);
    res
      .status(500)
      .json({
        message:
          "We could not confirm your order. Retry with the same checkout details",
      });
  }
};

// ----- GET USERS ----
// GET /api/orders/my-orders
// Returns all orders belonging to the logged-in user

export const getUserOrders = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // Find  orders where userId matches the looged-in users ID
    const orders = await Order.find({ userId: req.user!._id }).sort({
      createdAt: -1,
    }); // Newest order comes first
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching your orders" });
  }
};

// ----- GET ORDER BY ID ----
// GET /api/orders/:id

export const getOrderById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ message: "Order not Found" });
      return;
    }

    // Security check: non-admin usres can only veiw their own numbers

    if (
      !req.user?.isAdmin &&
      order.userId?.toString() !== req.user?._id.toString()
    ) {
      res.status(403).json({ message: "Not authorized to veiw this order" });
      return;
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching" });
  }
};

// ----- ADMIN: GET ALL ORDERS-----
//  GET /api/admin/orders
export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }); // newest orders comes first
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching orders " });
  }
};

// ----- ADMIN: UPDATE ORDER STATUS ----
//  PUT /api/admin/orders/:id/status
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }
    const status = req.body?.status;

    //Validate the status

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid order status" });
      return;
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    if (order.status === status) {
      res.status(200).json(order);
      return;
    }
    const transitions: Record<string, readonly string[]> = {
      pending: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };
    if (!transitions[order.status]?.includes(status)) {
      res
        .status(409)
        .json({
          message:
            "An order cannot move from " + order.status + " to " + status,
        });
      return;
    }
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status },
      {
        $set: {
          status,
          ...(status === "delivered" ? { deliveredAt: new Date() } : {}),
        },
      },
      { new: true, runValidators: true },
    );
    if (!updatedOrder) {
      res
        .status(409)
        .json({
          message: "This order changed elsewhere. Reload before updating it",
        });
      return;
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Server arror updating status" });
  }
};

// -------ADMIN : GET DASHBOARD STATS ----
// GET/api/admin/stats
//  Returns aggregate data for the admin dashboard

export const getDashboardstats = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    //Run multiple database queries in parrel using Promise.all
    // This is faster than running them one by one

    const [
      totalOrders, //Total number of orders
      totalUsers, //Total number of users
      revenueResult, // Sum of all order grand total
      pendingOrders, //Orders not yet fulfilled
      outstandingResult,
      recentOrders, // Last 5 orders for dashboard
    ] = await Promise.all([
      Order.countDocuments(),
      //We need to import User here - do it inline
      (await import("../models/User")).default.countDocuments(),

      // Mongodb aggregration: sum up all grandtotals values
      Order.aggregate([
        {
          $match: {
            status: "delivered",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$orderSummary.grandTotal" },
          },
        },
      ]),
      Order.countDocuments({ status: "pending" }),
      Order.aggregate([
        { $match: { status: { $in: ["pending", "processing", "shipped"] } } },
        { $group: { _id: null, total: { $sum: "$orderSummary.grandTotal" } } },
      ]),
      Order.find({}).sort({ createdAt: -1 }).limit(5),
    ]);

    //Monthly revenue for the past 6 months
    const sixMonthsago = new Date();
    sixMonthsago.setUTCDate(1);
    sixMonthsago.setUTCHours(0, 0, 0, 0);
    sixMonthsago.setUTCMonth(sixMonthsago.getUTCMonth() - 5);

    const monthlyRevenue = await Order.aggregate([
      { $addFields: { saleDate: { $ifNull: ["$deliveredAt", "$createdAt"] } } },
      {
        //only include orders for the past 6 months
        $match: {
          saleDate: { $gte: sixMonthsago },
          status: "delivered",
        },
      },

      {
        //Group by year and month

        $group: {
          _id: {
            year: { $year: "$saleDate" },
            month: { $month: "$saleDate" },
          },
          revenue: { $sum: "$orderSummary.grandTotal" },
          count: { $sum: 1 }, //count of orders that month
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }, //sort oldest to newest revenue
    ]);
    res.status(200).json({
      totalOrders,
      totalUsers,
      outstandingOrderValue: outstandingResult[0]?.total || 0,
      totalRevenue: revenueResult[0]?.total || 0, //default to 0 if no orders
      pendingOrders,
      recentOrders,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Dashboard stat error:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
};
