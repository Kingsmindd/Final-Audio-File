// Middleware runs BETWEEN recieving a request and processing it.
// "protect" checks if the user has valid JWT token to access some features on the website
// "admin" checks if the logged-in user is an admin

import { NextFunction, Response } from "express";
import { AuthRequest, IJwtPayload } from "../types/indexServer";
import Jwt from "jsonwebtoken";
import User from "../models/User";

// These middleware functions act like security guards:
// -protect: "Do you have a valid ID card?"
// -admin: "is you ID Card an admin pass?"

//---- protect middleware---
// Checks that the request has a valid JWT token in the authorization header
// Format: "Authorization: Bearer sklfdihfjoefmsdishydsmds"

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let token: string | undefined;

  // Check if the authorization header exists and starts with "Bearer"

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // extract the token : "Bearer TOKEN" -> "TOKEN"

      token = req.headers.authorization.split("")[1];
      // verify the token using our secret key
      // jwt.verify throws an error if the token is expired or invalid
      const decoded = Jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as IJwtPayload;

      // Find the user in the database using the ID stored in the token
      const user = await User.findById(decoded.id).select("-password"); //".select(-password)" means... give me everything EXCEPT the password

      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      // Attach the user to the request object
      // Now anyroute using "protect" can access req.user
      req.user = user;

      next(); // Move to the next middleware or route handler
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ message: "Not authorized - invalid token" });
      return;
    }
  }

  // If no token found at all, reject the request
  if (!token) {
    res.status(401).json({ message: "Not authorized - no token provided" });
    return;
  }
};

// ---- admin middleware -----
// MUST be used AFTER "protect" - it relies on req.user being set
// checks if the logged-in user has admin privileges
export const admin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  // req.user was set by the "protect" middleware above
  if (req.user && req.user.isAdmin) {
    next(); // user is admin - allow access
  } else {
    res.status(403).json({ message: "Not authorised as admin" });
  }
};
