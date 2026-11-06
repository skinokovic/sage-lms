import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getSubmissions,
  getSubmission,
  saveNotes,
  gradeSubmission,
  returnSubmission,
} from "../controllers/instructorSubmissionController.js";

const router = express.Router();

router.use(authenticate, authorize("instructor"));

router.get("/", getSubmissions);
router.get("/:id", getSubmission);
router.patch("/:id/notes", saveNotes);
router.patch("/:id/grade", gradeSubmission);
router.patch("/:id/return", returnSubmission);

export default router;
