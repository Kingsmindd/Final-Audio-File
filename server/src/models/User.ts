// Defines  the user data structure in mongoDB using Mongoose
// A "model" is like a blueprint for every user document that will be stored in the database

import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/indexServer";
import bycrypt from "bcryptjs";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // No two users can have the same email
      trim: true, // Remove spaces from start and end incase of users mistake
      lowercase: true, // always store emails in lowercase in the database
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Invalid email format",
      ], // Regex email verification
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least characters"],
    },

    isAdmin: {
      type: Boolean,
      required: true,
      default: false, //New users are Not admins by default
    },

    //Optional profile avatar stored as a Cloudnairy URL
    avatar: {
      type: String,
      default: "",
    },
    //we stored this so we can DELETE the old avatar from cloudnairy when the user uploads a new one (to save storage space)
    avatarPublicId: {
      type: String,
      default: "",
    },

    //optional contact info for faster checkout
    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },
  },

  {
    timestamps: true,
  },
);

// ======= MIDDLEWARE(RUNS AUTOMATICALLY BEFORE SAVING) ======
// Pre ("save") runs BEFORE a user document is saved to the database
// we use this to hash passwords so plain text is NEVER STORED
userSchema.pre("save", async function (next) {
  //This refers to the user being saved
  // only hash if the password was actually changed
  // this prevents re-hashing an already hashed password
  if (!this.isModified("password")) {
    return;
  }

  //bycrypt creates a random "salt" (extra random data)
  const salt = await bycrypt.genSalt(10); // The "10" is the cost factor - higher = secure but slower

  //   Hash the password with the salt
  this.password = await bycrypt.hash(this.password, salt);
});

// ===== METHODS (Custom function on user document) ====
// Compare an entered plain-text password with the stored hash
// Return true if they match , false if the dont
userSchema.methods.matchPassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return await bycrypt.compare(enteredPassword, this.password);
};

//Create and export the User model
// mongoose .model ("User", userSchema) creates a  model named "User"
// MongoDB will store documents in a collection called "users" (auto-pluralized)

const User = mongoose.model<IUser>("User", userSchema);

export default User;
