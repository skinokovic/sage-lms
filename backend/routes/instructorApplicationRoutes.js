import express from "express";
import {
  approveApplication,
  createApplication,
  getApplicationById,
  getMyApplication,
  listApplications,
  markUnderReview,
  rejectApplication,
} from "../controllers/instructorApplicationController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createApplication);
router.get("/me", getMyApplication);
router.get("/", listApplications);
router.get("/:id", getApplicationById);
router.patch("/:id/review", markUnderReview);
router.patch("/:id/approve", approveApplication);
router.patch("/:id/reject", rejectApplication);

export default router;
