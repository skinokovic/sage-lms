import express from "express";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  setCouponStatus,
  deleteCoupon,
  getRedemptions,
} from "../controllers/couponController.js";

const router = express.Router();

router.use(authenticate, adminOnly);

router.get("/", listCoupons);
router.post("/", createCoupon);
router.patch("/:id/status", setCouponStatus);
router.get("/:id/redemptions", getRedemptions);
router.patch("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;
