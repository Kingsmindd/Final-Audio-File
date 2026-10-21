import "dotenv/config";
//The main entry point of our Express server
// This file:
//1. Create the express application
//2. Sets up the middleware (CORS, JSON parsing, logging)
//3. Registers all routes
//4. Connects to MongoDB
//5. Starts listening for HTTP requests

import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import cartRoutes from "./routes/cartRoutes";
import { errorHandler } from "./middleware/errorMiddleware";

// load enviroment variables from .env file
//  Must be called BEFORE any code that uses process.env

if (!process.env.JWT_SECRET?.trim()) {
  throw new Error("JWT_SECRET environment variable is required");
}

const app = express();

// --- MIDDLEWARE SETUP----
// Middleware are functions that run on every request before your routes

//CORS: Allow requests from any origin
//origin :true reflects the request origin, which works  with credentials
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Parse incoming JSON request bodies
//limit:10mb allows base64 images uploads in the rq.body
app.use(express.json({ limit: "10mb" }));

// Parse URL- enconded form data (e.g, from HTML forms)
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//Simple request logger- logs every incoming request
//Useful for debbugging in development
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next(); // Always call next() to continue processing
});

// --- ROUTE REGISTRATION---
// Tell express which routes to use and what URL prefix they start with

// Authenication routes: /api/auth/register
app.use("/api/auth", authRoutes);

// Product routes: /api/products, /api/products
app.use("/api/products", productRoutes);

//Order routes : /api/orders
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

// Admin routes: api/admin/users etc
app.use("/api/admin", adminRoutes);

// Health check - a simple endpoint to verify the server is running
//Used by development platforms (like render) to check server health
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    message: "Audiophile server is running",
    timestamp: new Date().toISOString(),
    enviroment: process.env.NODE_ENV || "development",
  });
});

//404 HANDLER - catches any request to undefined routes
app.use((_req, res) => {
  res.status(404).json({ message: "API  endpoint not found" });
});

// Error handler - MUST be the LAST middleware
// Express recognize it as an error handler because it has 4 parameters(err, req,res, next)

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

const startSever = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀Server is running on port: ${PORT}`);
      console.log(`🌍 Enviroment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.log("Failed to start server", error);

    process.exit(1);
  }
};

// Handle unhandled promises rejections (catches async errors not caught by try/catch)
process.on("unhandledRejection", (reason: Error) => {
  console.error("Unhandled Promise Rejection:", reason.message);
  process.exit(1);
});
startSever();

export default app;

//https://final-audio-file.onrender.com
//https://final-audiofile-anko.vercel.app/
