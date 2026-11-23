import { rateLimit } from "express-rate-limit";

// One Render instance: counters reset on restart. Use a shared store if scaling out.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many sign-in attempts. Please try again in 15 minutes",
  },
});
export const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many registration attempts. Please try again in 15 minutes",
  },
});
export const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip: (req) => !req.body?.password,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many password change attempts. Please try again in 15 minutes",
  },
});
