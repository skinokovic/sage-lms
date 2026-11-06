import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import {
  submitMessage,
  getMessages,
  updateMessageStatus,
  deleteMessage,
} from "../controllers/contactController.js";

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many messages sent, please try again later.",
  },
});

// Public
router.post("/", contactLimiter, submitMessage);

// Admin
router.use(authenticate, adminOnly);
router.get("/", getMessages);
router.patch("/:id", updateMessageStatus);
router.delete("/:id", deleteMessage);

export default router;
