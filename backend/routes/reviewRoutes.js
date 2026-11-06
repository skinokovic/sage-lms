import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate, authorize } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import {
  getCourseReviews,
  getInstructorReviews,
  getMyCourseReview,
  saveMyReview,
  deleteMyReview,
  getMyReviews,
  getReceivedReviews,
  getAdminReviews,
  setReviewStatus,
  deleteReviewAdmin,
} from "../controllers/reviewController.js";

const router = express.Router();

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many review changes, please try again later.",
  },
});

// ---- Public ----
router.get("/course/:courseId", getCourseReviews);
router.get("/instructor/:id", getInstructorReviews);

// ---- Student ----
router.get("/mine", authenticate, authorize("student"), getMyReviews);
router.get("/course/:courseId/me", authenticate, getMyCourseReview);
router.put("/course/:courseId", authenticate, authorize("student"), writeLimiter, saveMyReview);
router.delete("/course/:courseId", authenticate, authorize("student"), writeLimiter, deleteMyReview);

// ---- Instructor ----
router.get("/received", authenticate, authorize("instructor"), getReceivedReviews);

// ---- Admin ----
router.get("/admin", authenticate, adminOnly, getAdminReviews);
router.patch("/admin/:id", authenticate, adminOnly, setReviewStatus);
router.delete("/admin/:id", authenticate, adminOnly, deleteReviewAdmin);

export default router;
