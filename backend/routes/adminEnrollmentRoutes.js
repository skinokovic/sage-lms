import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  searchStudents,
  getEnrollableCourses,
  enrollStudent,
} from "../controllers/adminEnrollmentController.js";

const router = Router();

// Admins only.
router.use(authenticate, authorize("admin"));

router.get("/students", searchStudents);
router.get("/courses", getEnrollableCourses);
router.post("/", enrollStudent);

export default router;
