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
  const match = /^Bearer ([^\s]+)$/.exec(req.headers.authorization || "");
  if (!match) {
    res.status(401).json({ message: "Please sign in to continue" });
    return;
  }
  let decoded: IJwtPayload;
  try {
    const payload = Jwt.verify(match[1], process.env.JWT_SECRET as string, { algorithms: ["HS256"] });
    if (typeof payload === "string" || typeof payload.id !== "string" ||
        !/^[a-f0-9]{24}$/i.test(payload.id) ||
        (payload.sessionVersion !== undefined && !Number.isSafeInteger(payload.sessionVersion))) {
      throw new Error("Invalid token payload");
    }
    decoded = payload as IJwtPayload;
  } catch {
    res.status(401).json({ message: "Your session has expired. Please sign in again" });
    return;
  }
  try {
    const user = await User.findById(decoded.id).select("-password +sessionVersion");
    if (!user || (decoded.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) {
      res.status(401).json({ message: "Your session has expired. Please sign in again" });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error); // A database outage is not an invalid login.
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

export const optionalProtect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.headers.authorization !== undefined) {
    void protect(req, res, next);
    return;
  }

  next();
};
