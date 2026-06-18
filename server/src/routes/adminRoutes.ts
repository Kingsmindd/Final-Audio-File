import express from "express";
import {
  deleteUser,
  getAllUsers,
  updateUserRole,
} from "../controller/userController";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  uploadProductImage,
} from "../controller/productController";
import upload from "../middleware/uploadMiddleware";
import {
  getAllOrders,
  getDashboardstats,
  updateOrderStatus,
} from "../controller/orderControllers";
import { admin, protect } from "../middleware/authMiddleware";

const router = express.Router();

// Apply BOTH protected and admin middleware to ALL routes in the field
// Every route below requires the user  to be logged in AND be an admin

router.use(protect, admin);

//---- Dahboard----
//GET /api/admin/stats -> totals,revenue,recent orders etc

router.get("/stats", getDashboardstats);
// ---- USER MANAGEMENT BY ADMIN --

// GET /api/admin/users --- get all your website users as the admin
router.get("/users", getAllUsers);

// PUT /api/admin/users/:id -- update user (toggle admin)
router.put("/users/:id", updateUserRole);

// DELETE /api/admin/users/:id -- delete user
router.delete("/users/:id", deleteUser);

//--- PRODUCT MANAGEMENT ---
// POST /api/admin/products  ->
router.post("/products", createProduct);

//POST /api/admin/products/upload-image -> upload image to cloudinary
// upload.single("image") = Multer processes one file in the "image" filed
router.post(
  "/products/upload-image",
  upload.single("image"),
  uploadProductImage,
);

//PUT /api/admin/products/:id -> edit a product
router.put("/products/:id", updateProduct);

//DELETE /api/admin/products/:id -> remove a product
router.delete("/products/:id", deleteProduct);

// ----- ORDERS MANAGEMENT ---
//GET  /api/admin/orders -> all orders
router.get("/orders", getAllOrders);

//PUT  /api/admin/orders/:id/status -> update status
router.put("/orders/:id/status", updateOrderStatus);

export default router;
