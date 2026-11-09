import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/auth.js";
import { validateCoupon } from "../controllers/couponController.js";

const router = express.Router();

// Slows down anyone trying to guess codes
const validateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: {
    success: false,
    message:
      "Too many coupon attempts. Please wait a few minutes and try again.",
  },
});

// Guests can check a code in the cart; a logged-in student is identified so
// the per-student limit is checked too.
const identifyIfLoggedIn = (req, res, next) =>
  req.headers.authorization ? authenticate(req, res, next) : next();

router.post("/validate", validateLimiter, identifyIfLoggedIn, validateCoupon);

export default router;
