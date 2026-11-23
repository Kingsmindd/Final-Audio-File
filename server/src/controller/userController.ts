// Handles all user-related HTTP requests
// - register (sign up)
// - login (sign in )
// -getProfile (users get to view their own profile )
// -updateProfile (edit name, phone, address)
// -updateAvatar (upload new profile picture)
// - getAllUsers (admin only)
// - updateUserRole (admin only - promote/demote users)
// - deleteUser (admin only)

// A "controller" is a function that recieves a request and sends a response
// its the logic layer between your routes and your database.

import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types/indexServer";
import { deleteImage, uploadImage } from "../config/cloudinary";
import mongoose from "mongoose";
import { validEmail, validPassword, cleanEmail } from "../validation/auth";

// Helper:generate a JWT token for a user
// JWT = JSON web token - a signed string that proves who the user is
const generateToken = (id: string, sessionVersion = 0): string => {
  return jwt.sign({ id, sessionVersion }, process.env.JWT_SECRET as string, {
    expiresIn: "3d",
  });
};
// --- REGISTER----
// POST /api/auth/register
// Creates a new user account
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        message: "Name, email, and password must be text",
      });
      return;
    }

    if (!name.trim() || name.trim().length > 100 || !validEmail(email) || !validPassword(password)) {
      res.status(400).json({ message: "Enter a name (1-100 characters), a valid email, and a password of at least 8 characters (maximum 72 UTF-8 bytes)" });
      return;
    }
    // Check if a user with this email already exists

    const userExists = await User.findOne({ email: cleanEmail(email) });

    if (userExists) {
      res
        .status(400)
        .json({ message: "An account with this email already exists" });
      return;
    }

    // create the user - the pre-save hook in User.ts will hash the password
    const user = await User.create({ name: name.trim(), email: cleanEmail(email), password });

    // Registration does not start a session; the customer signs in next.
    res.status(201).json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
    });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// json web token

// ---LOGIN----
// POST/api/auth/login
// Authenticates a user and returns a token
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({
        message: "Email and password must be text",
      });
      return;
    }
    if (!validEmail(email) || !validPassword(password)) {
      res.status(400).json({ message: "Please provide email and password" });
      return;
    }
    // Find user by email
    const user = await User.findOne({ email: cleanEmail(email) }).select("+sessionVersion");

    // Check user exists AND password amtches
    // user.matchPassword is defined on the user model
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        token: generateToken(user._id.toString(), user.sessionVersion ?? 0),
      });
    } else {
      // use a vague error messgae for security
      // (dont tell hackers whether the email or password is wrong)
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server arror during login" });
  }
};

// ------ GET PROFILE -----
// GET/api/auth/profile
// Returns the logged-in users profile (requires token)
export const getProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // req.user is set by the "protect" middleware
    const user = await User.findById(req.user!._id).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not Found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server arror" });
  }
};

// ----  UPDATE PROFILE ----
// PUT /api/auth/profile
// update users name , phone or address
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select("+sessionVersion");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if ((user.sessionVersion ?? 0) !== (req.user!.sessionVersion ?? 0)) {
      res.status(401).json({ message: "Your session has expired. Please sign in again" });
      return;
    }
    const body = req.body ?? {};
    for (const [field, max] of [["name", 100], ["phone", 40], ["address", 300]] as const) {
      if (body[field] !== undefined && (typeof body[field] !== "string" || body[field].trim().length > max ||
          (field === "name" && !body[field].trim()))) {
        res.status(400).json({ message: "Enter a valid " + field + " (maximum " + max + " characters)" });
        return;
      }
    }
    if (body.password !== undefined && body.password !== "") {
      if (!validPassword(body.password) || !validPassword(body.currentPassword)) {
        res.status(400).json({ message: "Enter your current password and a new password of at least 8 characters (maximum 72 UTF-8 bytes)" });
        return;
      }
      if (!await user.matchPassword(body.currentPassword)) {
        res.status(400).json({ message: "Current password is incorrect" });
        return;
      }
      if (body.password === body.currentPassword) {
        res.status(400).json({ message: "Choose a different new password" });
        return;
      }
      user.password = body.password;
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    }
    if (body.name !== undefined) user.name = body.name.trim();
    if (body.phone !== undefined) user.phone = body.phone.trim();
    if (body.address !== undefined) user.address = body.address.trim();

    // save the updated user to the database
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      avatar: updatedUser.avatar,
      phone: updatedUser.phone,
      address: updatedUser.address,
      token: generateToken(updatedUser._id.toString(), updatedUser.sessionVersion ?? 0),
    });
  } catch (error) {
    if (error instanceof mongoose.Error.VersionError) {
      res.status(409).json({ message: "Your profile changed elsewhere. Reload and try again" });
      return;
    }
    res.status(500).json({
      message: "Server error updating profile",
    });
  }
};

// --- UPDATE AVATAR ----
// POST /api/auth/avatar
//Uploads a new profile picture to cloudinary

export const updateAvatar = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    //req.file is set by the multer middleware

    if (!req.file) {
      res.status(400).json({ message: "No image file provide" });
      return;
    }

    const user = await User.findById(req.user!._id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    //Delete the old avatar from cloudinary first (to save storage)

    if (user.avatarPublicId) {
      await deleteImage(user.avatarPublicId);
    }

    // convert the file buffer  to a base64 data URI for cloudinary upload
    //cloudinary accepts based64 strings as input

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // upload to cloudinary - return an object with url, public_id etc
    const result = await uploadImage(base64, "audiophile");

    // save the new cloudinary URL and public ID to the user

    user.avatar = result.secure_url;
    user.avatarPublicId = result.public_id;
    await user.save();

    res.json({ message: "Avatar updated successfully" });
  } catch (error) {
    console.error("Avatar upload error: ", error);
    res.status(500).json({ message: "Server error uploading avatar " });
  }
};

// ADMIN : GET  ALL USERS
// GET /api/admin/users
// Returns all users (admin only)
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // Fetch all users, excluding their passwords
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching users" });
  }
};

// ---- ADMIN: UPDATE USER ROLE----
// PUT /api/admin/usres/:id
//toggle admin status or update user info (admin only)

export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    if (typeof req.body?.isAdmin !== "boolean") {
      res.status(400).json({
        message: "isAdmin must be true or false",
      });
      return;
    }
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.isAdmin = req.body.isAdmin;
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error updating user" });
  }
};

//--- ADMIN: DELETE USER ---
// DELETE /api/admin/users/:id
// permanently remove a user (admin only)

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Prevent admins from deleting themselves
    if (user._id.toString() === req.user!._id.toString()) {
      res.status(400).json({
        message: "You cannot delete your own account",
      });
      return;
    }

    // Remove the user's avatar from Cloudinary
    if (user.avatarPublicId) {
      await deleteImage(user.avatarPublicId);
    }

    await user.deleteOne();

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      message: "Server error deleting user",
    });
  }
};
