import { Document, Types } from "mongoose";
import { Request } from "express";

// This is the shape of a user document stored in mongoDB
// it extends mongoose's document so we get all mongodb methods (.save(), ._id, etc)
export interface IUser extends Document {
  _id: Types.ObjectId; // MongoDB auto-generated unique ID
  name: string; // User's display name
  email: string; // User's email (used for login)
  password: string; // Hashed password (never stored plain text)
  isAdmin: boolean; // True = admin user, false = regular user
  avatar?: string; // Optional profile picture URL (from cloudinary)
  avatarPublicId?: string; // Cloudinary public ID for detecting old avatars
  phone?: string; //  Optional phone number
  address?: string; // Optional default delivery address
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>; // Method to compare a plain-text password against the hashed stored password
}

// What we send back to the client after login/register (no password)
export interface IUserResponse {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  avatar?: string;
  phone?: string;
  address?: string;
  token: string; //   JWT token for authentication
}

// frontend---Storage
// backend---save

// ------Products Types -----
// Shape of an items that comes IN the box with a product
export interface IBoxItem {
  quantity: number;
  item: string;
}

// Shape of a product document in MongoDB
export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  category: "headphones" | "speakers" | "earphones";
  price: number;
  image: string;
  description: string;
  features: string;
  inTheBox: IBoxItem[];
  gallery: string[];
  isNewArrival: boolean;
  createdAt: Date;
}
// ---- Order Types ---
// Billing/Shipping info collected at checkout
export interface ICustomerInfo {
  name: string;
  email: string;
  phone: string;
  addess: string;
  zipCode: string;
  city: string;
  country: string;
  paymentMethod: "e-Money" | "Cash on Delivery";
  eMoneyNumber?: string;
  eMoneyPIN?: string;
}

// One item in an order (snapshot of product at time of purchase )
export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

// The financial summary of an order
export interface IOrderSummary {
  subtotal: number;
  shipping: number;
  vat: number;
  grandTotal: number;
}

// Shape of Order document in MongoDB
export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderId: string;
  userId?: Types.ObjectId;
  customerInfo: ICustomerInfo;
  cartItems: IOrderItem[];
  orderSummary: IOrderSummary;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
}

// ------- Auth / Request Extensions ----
// Express Request extended with our user - used in protected routes
//  When a user is logged in , we attach their info to the request object
export interface AuthRequest extends Request {
  user?: IUser; // The logged-in user (populated by the protect middleware)
}

// ----- JWT Payload ---
//  What we store inside the JWT token
export interface IJwtPayload {
  id: string; // users mongodb _id
}
