// Define all authenication- related API endpoints
//  "Routes" tells express which controller function to run when a specific URL is hit with a specific HTTP method

import express from "express";
import {
  getProfile,
  login,
  register,
  updateAvatar,
  updateProfile,
} from "../controller/userController";
import { protect } from "../middleware/authMiddleware";
import upload from "../middleware/uploadMiddleware";

const router = express.Router();
// Public routes - anyone can access these

// POST /api/auth/register creates new account
router.post("/register", register);

// POST /api/auth/login sign in and recieve a token

router.post("/login", login);
// protected routes -- must send a valid JWT token in the authorization header
//GET /api/auth/profile - view your own profile
router.get("profile", protect, getProfile);

//PUT /api/auth/profile -- update name, phone address or password
router.put("/profile", protect, updateProfile);

// POST api/auth/avatar -- upload a new profile picture
router.post("/avatar", protect, upload.single("avatar"), updateAvatar); // "upload.single("avatar") means Multer will look for a field named "avatar"
export default router;
