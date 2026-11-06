import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import {
  subscribe,
  getSubscribers,
  deleteSubscriber,
} from "../controllers/subscriberController.js";

const router = express.Router();

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  },
});

// Public
router.post("/", subscribeLimiter, subscribe);

// Admin
router.use(authenticate, adminOnly);
router.get("/", getSubscribers);
router.delete("/:id", deleteSubscriber);

export default router;
