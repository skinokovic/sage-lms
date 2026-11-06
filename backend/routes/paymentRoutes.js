import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  initializePayment,
  verifyPayment,
  paystackWebhook,
  getOrderStatus,
} from "../controllers/payStackController.js";
import { authenticate, authorize } from "../middleware/auth.js"; // use the exact path from step 1

const router = Router();

const initializeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many checkout attempts, please try again later.",
  },
});

router.post(
  "/initialize",
  authenticate,
  authorize("student"),
  initializeLimiter,
  initializePayment,
);
router.get(
  "/verify/:reference",
  authenticate,
  authorize("student"),
  verifyPayment,
);
router.get(
  "/status/:reference",
  authenticate,
  authorize("student"),
  getOrderStatus,
);
router.post("/webhook", paystackWebhook);

export default router;
