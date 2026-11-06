import express from "express";

import {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateAssignmentStatus,
} from "../controllers/adminAssignmentController.js";

import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   ADMIN ASSIGNMENTS
============================================================ */

router.get("/assignments", authenticate, authorize("admin"), getAssignments);

router.get("/assignments/:id", authenticate, authorize("admin"), getAssignment);

router.post("/assignments", authenticate, authorize("admin"), createAssignment);

router.put(
  "/assignments/:id",
  authenticate,
  authorize("admin"),
  updateAssignment,
);

router.delete(
  "/assignments/:id",
  authenticate,
  authorize("admin"),
  deleteAssignment,
);

router.patch(
  "/assignments/:id/status",
  authenticate,
  authorize("admin"),
  updateAssignmentStatus,
);

export default router;
