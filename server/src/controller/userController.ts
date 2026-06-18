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

// Helper:generate a JWT token for a user
// JWT = JSON web token - a signed string that proves who the user is
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: "3d",
  });
};
// --- REGISTER----
// POST /api/auth/register
// Creates a new user account
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    //Basic validation = check all required fields are present
    if (!name || !email || !password) {
      res
        .status(400)
        .json({ message: "Please provide name, email and password " });
      return;
    }
    // Check if a user with this email already exists

    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      res
        .status(400)
        .json({ message: "An account with this email already exists" });
      return;
    }

    // create the user - the pre-save hook in User.ts will hash the password
    const user = await User.create({ name, email, password });

    // Respond with user data and a token
    res.status(201).json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
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
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Please provide email and password" });
      return;
    }
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

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
        token: generateToken(user._id.toString()),
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
    const user = await User.findById(req.user!._id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Only update fields that were actually sent in the request
    // "?? user.name" means (if req.body.name is null/defined, keep old)

    user.name = req.body.name ?? user.name;
    user.phone = req.body.phone ?? user.phone;
    user.address = req.body.address ?? user.address;

    if (req.body.password) {
      if (req.body.password.length < 8) {
        res
          .status(400)
          .json({ message: "Password must be at least 8 character" });
        return;
      }
      user.password = req.body.password; // The pre-save hook will hash thsi new password automatically
    }

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
      token: generateToken(updatedUser._id.toString()),
    });
  } catch (error) {
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
      .select("password")
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
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.isAdmin = req.body.isAdmin ?? user.isAdmin;
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
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        message: "User not Found",
      });
      return;
    }

    // prevent admins from deleting themselves

    if (user._id.toString() === req.user!._id.toString()) {
      res.status(400).json({ message: "You cannot delete your own account" });
      return;
    }
    // cleanup cloudinary avatar if it exists

    if (user.avatarPublicId) {
      await deleteImage(user.avatarPublicId);
    }

    await user.deleteOne;
    res.status(204).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting user", error });
  }
};
