import express from "express";
import { authenticate, authorize } from "../middleware/auth.js"; // adjust to your actual filename
import { uploadImage, uploadVideo } from "../middleware/upload.js";
import {
  createCourse,
  getMyCourses,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  uploadThumbnail,
  uploadMediaAsset,
  getPublishedCourseById,
  getPublishedCourses,
  getCourseForLearning,
  markLessonComplete,
} from "../controllers/courseController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PUBLIC COURSE ROUTES
|--------------------------------------------------------------------------
| These must be registered before router.use(authenticate).
*/

router.get("/public", getPublishedCourses);
router.get("/public/:id", getPublishedCourseById);

/*
|--------------------------------------------------------------------------
| PROTECTED COURSE ROUTES
|--------------------------------------------------------------------------
*/

router.use(authenticate);

router.get("/mine", authorize("instructor"), getMyCourses);
router.get("/", authorize("admin"), getAllCourses);
router.post("/", authorize("instructor", "admin"), createCourse);

// Learning player + student progress
router.get("/:id/learn", getCourseForLearning);
router.post("/:id/lessons/:lessonId/complete", markLessonComplete);

router.get("/:id", getCourseById);
router.patch("/:id", updateCourse);
router.delete("/:id", deleteCourse);

router.post("/:id/thumbnail", uploadImage, uploadThumbnail);
router.post("/upload/video", uploadVideo, uploadMediaAsset);

export default router;
