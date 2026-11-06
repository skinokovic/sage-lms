import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getInstructorStudents,
  getInstructorStudentDetail,
} from "../controllers/instructorStudentController.js";

const router = Router();

// Instructors only: each instructor sees only their own students.
router.use(authenticate, authorize("instructor"));

router.get("/", getInstructorStudents);
router.get("/:studentId", getInstructorStudentDetail);

export default router;
