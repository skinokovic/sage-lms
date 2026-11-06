import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  updateAssignmentStatus,
  duplicateAssignment,
  deleteAssignment,
} from "../controllers/instructorAssignmentController.js";

const router = express.Router();

router.use(authenticate, authorize("instructor"));

router.get("/", getAssignments);
router.post("/", createAssignment);
router.get("/:id", getAssignment);
router.patch("/:id", updateAssignment);
router.patch("/:id/status", updateAssignmentStatus);
router.post("/:id/duplicate", duplicateAssignment);
router.delete("/:id", deleteAssignment);

export default router;
