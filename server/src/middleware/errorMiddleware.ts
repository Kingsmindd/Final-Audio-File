// Global error handler for the express application
// when any route throws an error , express passes it more
// This gives us a single place to format and send error responses

// Useage: any async errror thrown in a route handler will automatically be caught if you use "next(error)" or if you wrap with asyncHandler

import { Request, Response, NextFunction } from "express";

//Custom error class so we can attach a status code to our errors
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message); // call the parent Error class constructor
    this.statusCode = statusCode;
    this.isOperational = true; // Marks this as a "known" operational error

    // captures the stack trace (helps with debugging)
    Error.captureStackTrace(this, this.constructor);
  }
}

//The main error handler - express recongnize it has 4 parameters (err, req, res, next)
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Make a copy of the error so we dont mutate the original
  let statusCode = err.statusCode || 500;
  let message = err.message || "Sever Error";

  //    ---- Handle specific Mongoose errors -----

  // CastError: When mongDB gets an invalid ID format (not a valid ObjectID)
  //  e.g.., /api/products/not-real-id

  if (err.name === "CastError") {
    message = "Resource not found - invalid ID";
    statusCode = 404;
  }
  //Duplicate key error: e.g trying to register with an email already used

  if (err.code === 1100) {
    //Extract the field name the error (e.g "email")
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value: ${field} already exists`;
    statusCode = 400;
  }

  //Mongoose validation error: e.g , missing required field
  if (err.name === "ValidationError") {
    // collect all validation error messages into one string
    message = Object.values(err.errors)
      .map((e: any) => e.message)
      .join(", ");
    statusCode = 400;
  }

  //JWT token errors

  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    statusCode = 401;
  }

  //if token as expired

  if (err.name === "TokenExpiredError") {
    message = "Token has expired - please log in again";
    statusCode = 401;
  }

  //Send the error nonsense

  res.status(statusCode).json({
    success: false,
    message,
    //only show the full stack trace in development (not in production)
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

//helper to wrap async route handlers - catches promise rejections automatically
// without this , unhandled promise rejections crash the server
export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
