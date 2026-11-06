import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Enrollment from "../models/CourseEnrollment.js";
import Course from "../models/Course.js";
import Progress from "../models/Progress.js";

// Enrollments with these statuses give a student access to a course.
const COUNTED_STATUSES = ["active", "completed"];
const ALL_STATUSES = ["active", "completed", "revoked"];

// Matches the logged-in student's enrollments by account id, or by email for
// enrollments created from a payment before accounts were linked.
const ownEnrollmentFilter = (user) => ({
  $or: [
    { user: user._id },
    { studentEmail: String(user.email || "").toLowerCase() },
  ],
});

// @desc    Enroll the current student in a FREE course
// @route   POST /api/enrollments
// @access  Private (student)
//
// Paid courses are never enrolled here: they are enrolled by the payment flow
// once Paystack confirms the payment.
const createEnrollment = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  if (!courseId || !mongoose.isValidObjectId(courseId)) {
    res.status(400);
    throw new Error("A valid courseId is required");
  }

  if (req.user.role !== "student") {
    res.status(403);
    throw new Error("Only students can enroll in courses");
  }

  const course = await Course.findById(courseId).select("title price status");

  if (!course || course.status !== "Published") {
    res.status(404);
    throw new Error("Course not found");
  }

  if (Number(course.price) > 0) {
    res.status(402);
    throw new Error(
      "This course is paid. Complete payment at checkout to enroll.",
    );
  }

  const existing = await Enrollment.findOne({
    course: course._id,
    ...ownEnrollmentFilter(req.user),
  });

  if (existing) {
    res.status(409);
    throw new Error("Already enrolled in this course");
  }

  const enrollment = await Enrollment.create({
    user: req.user._id,
    course: course._id,
    studentEmail: req.user.email,
    studentName: req.user.name,
    studentPhone: req.user.phone || "",
    status: "active",
    paymentMethod: "free",
  });

  res.status(201).json({ success: true, enrollment });
});

// @desc    Get the current student's enrollments, with live progress
// @route   GET /api/enrollments/me
// @access  Private
const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({
    ...ownEnrollmentFilter(req.user),
    status: { $in: COUNTED_STATUSES },
  })
    .sort({ enrolledAt: -1 })
    .populate(
      "course",
      "title thumbnail category level duration price status modules._id modules.lessons._id",
    )
    .lean();

  // Ignore enrollments whose course has since been deleted.
  const usable = enrollments.filter((enrollment) => enrollment.course);

  const courseIds = usable.map((enrollment) => enrollment.course._id);

  const progressRows = courseIds.length
    ? await Progress.find({
        userId: req.user._id,
        courseId: { $in: courseIds },
        completed: true,
      })
        .select("courseId lessonId")
        .lean()
    : [];

  const doneByCourse = new Map();
  progressRows.forEach((row) => {
    const key = String(row.courseId);
    if (!doneByCourse.has(key)) doneByCourse.set(key, new Set());
    doneByCourse.get(key).add(String(row.lessonId));
  });

  const result = usable.map((enrollment) => {
    const { modules, ...course } = enrollment.course;

    const lessonIds = new Set(
      (modules || []).flatMap((courseModule) =>
        (courseModule.lessons || []).map((lesson) => String(lesson._id)),
      ),
    );

    const done = doneByCourse.get(String(course._id)) || new Set();
    const completedLessons = [...done].filter((id) => lessonIds.has(id)).length;

    const courseSummary = { ...course, id: String(course._id) };

    return {
      ...enrollment,
      id: String(enrollment._id),
      course: courseSummary,
      // Kept so pages written for the old `courseId` field keep working.
      courseId: courseSummary,
      totalLessons: lessonIds.size,
      completedLessons,
      progress:
        lessonIds.size > 0
          ? Math.min(100, Math.round((completedLessons / lessonIds.size) * 100))
          : 0,
    };
  });

  res.json({ success: true, count: result.length, enrollments: result });
});

// @desc    Get all enrollments for a course (admin)
// @route   GET /api/enrollments/course/:courseId
// @access  Private/Admin
const getCourseEnrollments = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.courseId)) {
    res.status(404);
    throw new Error("Course not found");
  }

  const enrollments = await Enrollment.find({ course: req.params.courseId })
    .sort({ enrolledAt: -1 })
    .populate("user", "name email");

  res.json({ success: true, count: enrollments.length, enrollments });
});

// @desc    Update enrollment status
// @route   PUT /api/enrollments/:id
// @access  Private (owning student may drop; admin may set any status)
const updateEnrollment = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404);
    throw new Error("Enrollment not found");
  }

  const enrollment = await Enrollment.findById(req.params.id);

  if (!enrollment) {
    res.status(404);
    throw new Error("Enrollment not found");
  }

  const isOwner =
    String(enrollment.user || "") === String(req.user._id) ||
    enrollment.studentEmail === String(req.user.email || "").toLowerCase();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to modify this enrollment");
  }

  const { status } = req.body;

  if (status !== undefined) {
    if (!ALL_STATUSES.includes(status)) {
      res.status(400);
      throw new Error("Invalid enrollment status");
    }

    // Completion happens automatically when every lesson is finished, so a
    // student can only drop a course, never mark it completed or restore it.
    if (!isAdmin && status !== "revoked") {
      res.status(403);
      throw new Error("Only an administrator can set this status");
    }

    enrollment.status = status;
  }

  await enrollment.save();

  res.json({ success: true, enrollment });
});

export {
  createEnrollment,
  getMyEnrollments,
  getCourseEnrollments,
  updateEnrollment,
};
