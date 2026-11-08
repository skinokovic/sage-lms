import express from "express";
import rateLimit from "express-rate-limit";
import { chat } from "../controllers/assistantController.js";

const router = express.Router();

// Per visitor (IP): 20 messages every 10 minutes
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message:
      "You’re sending messages too quickly. Please wait a few minutes and try again.",
  },
});

router.post("/chat", chatLimiter, chat);

export default router;
