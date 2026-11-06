import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadSubmissionFiles, uploadAvatar } from "../middleware/upload.js";
import { getMyCourses } from "../controllers/studentController.js";
import {
  getMyAssignments,
  getMyAssignment,
  prepareSubmission,
  submitAssignment,
} from "../controllers/studentAssignmentController.js";
import { getMyGrades } from "../controllers/studentGradeController.js";
import { getStudentCertificates } from "../controllers/studentCertificateController.js";
import { getLibraryCourses } from "../controllers/studentLibraryController.js";
import {
  getMyProfile,
  updateMyProfile,
  updateMyAvatar,
} from "../controllers/studentProfileController.js";
import {
  getDashboard,
  getPendingAssignmentCount,
} from "../controllers/studentDashboardController.js";

const router = express.Router();

router.use(authenticate, authorize("student"));

router.get("/courses", getMyCourses);

router.get("/assignments", getMyAssignments);
router.get("/grades", getMyGrades);
router.get("/assignments/:id", getMyAssignment);
router.post(
  "/assignments/:id/submit",
  prepareSubmission,
  uploadSubmissionFiles,
  submitAssignment,
);
router.get("/certificates", getStudentCertificates);
router.get("/library", getLibraryCourses);
router.get("/profile", getMyProfile);
router.patch("/profile", updateMyProfile);
router.patch("/profile/avatar", uploadAvatar, updateMyAvatar);
router.get("/dashboard", getDashboard);
router.get("/pending-assignments", getPendingAssignmentCount);

export default router;
