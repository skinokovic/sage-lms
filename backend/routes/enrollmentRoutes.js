import express from "express";
const router = express.Router();
import {
  createEnrollment,
  getMyEnrollments,
  getCourseEnrollments,
  updateEnrollment,
} from "../controllers/enrollmentController.js";
import { authenticate, authorize } from "../middleware/auth.js";

router.post("/", authenticate, createEnrollment);
router.get("/me", authenticate, getMyEnrollments);
router.get(
  "/course/:courseId",
  authenticate,
  authorize("admin"),
  getCourseEnrollments,
);
router.put("/:id", authenticate, updateEnrollment);

export default router;
