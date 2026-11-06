import express from "express";

import {
  getInstructors,
  getInstructor,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  updateInstructorStatus,
} from "../controllers/adminInstructorController.js";

import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN INSTRUCTOR ROUTES
|--------------------------------------------------------------------------
*/

router.get("/instructors", authenticate, authorize("admin"), getInstructors);

router.get("/instructors/:id", authenticate, authorize("admin"), getInstructor);

router.post("/instructors", authenticate, authorize("admin"), createInstructor);

router.put(
  "/instructors/:id",
  authenticate,
  authorize("admin"),
  updateInstructor,
);

router.delete(
  "/instructors/:id",
  authenticate,
  authorize("admin"),
  deleteInstructor,
);

router.patch(
  "/instructors/:id/status",
  authenticate,
  authorize("admin"),
  updateInstructorStatus,
);

export default router;
