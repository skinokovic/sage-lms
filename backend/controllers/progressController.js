import crypto from "crypto";
import asyncHandler from "express-async-handler";
import Progress from "../models/Progress.js";
// import Lesson from "../models/Lesson.js";
import Enrollment from "../models/CourseEnrollment.js";
import Certificate from "../models/Certificate.js";

// @desc    Mark a lesson as completed for the current user
// @route   POST /api/progress
// @access  Private
const markLessonComplete = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.body;

  if (!courseId || !lessonId) {
    res.status(400);
    throw new Error("courseId and lessonId are required");
  }

  const enrollment = await Enrollment.findOne({
    userId: req.user._id,
    courseId,
  });
  if (!enrollment) {
    res.status(403);
    throw new Error("You must be enrolled in this course to track progress");
  }

  // const lesson = await Lesson.findById(lessonId);
  // if (!lesson) {
  //   res.status(404);
  //   throw new Error("Lesson not found");
  // }

  const progress = await Progress.findOneAndUpdate(
    { userId: req.user._id, courseId, lessonId },
    { completed: true, completedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Check if this completes the whole course
  // const totalLessons = await Lesson.countDocuments({ courseId });
  const completedLessons = await Progress.countDocuments({
    userId: req.user._id,
    courseId,
    completed: true,
  });

  let certificate = null;
  if (totalLessons > 0 && completedLessons >= totalLessons) {
    enrollment.status = "completed";
    enrollment.completedAt = new Date();
    await enrollment.save();

    certificate = await Certificate.findOne({ userId: req.user._id, courseId });
    if (!certificate) {
      certificate = await Certificate.create({
        userId: req.user._id,
        courseId,
        certificateCode: crypto.randomBytes(8).toString("hex").toUpperCase(),
      });
    }
  }

  res.json({
    success: true,
    progress,
    courseCompleted: totalLessons > 0 && completedLessons >= totalLessons,
    certificate,
  });
});

// @desc    Get the current user's progress for a course
// @route   GET /api/progress/:courseId
// @access  Private
const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const totalLessons = await Lesson.countDocuments({ courseId });
  const completedRecords = await Progress.find({
    userId: req.user._id,
    courseId,
    completed: true,
  });

  const percent =
    totalLessons > 0
      ? Math.round((completedRecords.length / totalLessons) * 100)
      : 0;

  res.json({
    success: true,
    courseId,
    totalLessons,
    completedLessons: completedRecords.length,
    percent,
    completedLessonIds: completedRecords.map((p) => p.lessonId),
  });
});

export { markLessonComplete, getCourseProgress };
