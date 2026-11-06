import express from "express";
const router = express.Router();
import {
  markLessonComplete,
  getCourseProgress,
} from "../controllers/progressController.js";
import { authenticate } from "../middleware/auth.js";

router.post("/", authenticate, markLessonComplete);
router.get("/:courseId", authenticate, getCourseProgress);

export default router;
