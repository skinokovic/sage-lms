import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Course from "../models/Course.js";
import Instructor from "../models/Instructor.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import {
  refreshCourseRating,
  refreshInstructorRating,
} from "../utils/reviewStats.js";

const COUNTED_ENROLLMENT_STATUSES = ["active", "completed"];
const MAX_COMMENT = 1000;

const isId = (value) => mongoose.Types.ObjectId.isValid(value);
const toId = (value) => new mongoose.Types.ObjectId(value);

const parsePaging = (query, defaultLimit = 10, maxLimit = 30) => ({
  page: Math.max(parseInt(query.page, 10) || 1, 1),
  limit: Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit),
});

const pagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

// "Chidi Okeke" -> "Chidi O." so public pages don't expose full names
const publicName = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SAGE Student";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

const asRating = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};

// Average, count and 1-5 star distribution for one rating field
const buildSummary = async (match, field) => {
  const rows = await Review.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let sum = 0;

  rows.forEach((row) => {
    distribution[row._id] = row.count;
    count += row.count;
    sum += row._id * row.count;
  });

  return {
    average: count ? Math.round((sum / count) * 10) / 10 : 0,
    count,
    distribution,
  };
};

// A student may review a course only while they hold an active or completed
// enrolment (matched by account id, or by email for payment-created ones).
const checkEligibility = async (user, courseId) => {
  if (!isId(courseId)) return { notFound: true };

  const course = await Course.findById(courseId).select("title status instructor");
  if (!course || course.status === "Draft") return { notFound: true };

  if (user.role !== "student") {
    return { course, eligible: false, reason: "Only students can review courses." };
  }

  const enrollment = await CourseEnrollment.findOne({
    course: course._id,
    status: { $in: COUNTED_ENROLLMENT_STATUSES },
    $or: [
      { user: user._id },
      { studentEmail: String(user.email || "").toLowerCase() },
    ],
  }).select("_id");

  if (!enrollment) {
    return {
      course,
      eligible: false,
      reason: "Enrol in this course to leave a review.",
    };
  }

  return { course, eligible: true };
};

/* ------------------------------------------------------------------ */
/* PUBLIC                                                              */
/* ------------------------------------------------------------------ */

// @route GET /api/reviews/course/:courseId?page=&limit=&sort=newest|highest|lowest
const getCourseReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!isId(courseId)) {
    res.status(404);
    throw new Error("Course not found");
  }

  const course = await Course.findOne({ _id: courseId, status: "Published" }).select("_id");
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const { page, limit } = parsePaging(req.query);
  const sorts = {
    newest: { createdAt: -1 },
    highest: { courseRating: -1, createdAt: -1 },
    lowest: { courseRating: 1, createdAt: -1 },
  };
  const sort = sorts[req.query.sort] || sorts.newest;
  const match = { course: course._id, status: "published" };

  const [summary, total, rows] = await Promise.all([
    buildSummary(match, "courseRating"),
    Review.countDocuments(match),
    Review.find(match)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("student", "name")
      .lean(),
  ]);

  res.json({
    success: true,
    summary,
    reviews: rows.map((row) => ({
      id: String(row._id),
      name: publicName(row.student?.name),
      rating: row.courseRating,
      comment: row.courseComment || "",
      createdAt: row.createdAt,
    })),
    pagination: pagination(page, limit, total),
  });
});

// @route GET /api/reviews/instructor/:id   (id = Instructor profile id)
const getInstructorReviews = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) {
    res.status(404);
    throw new Error("Instructor not found");
  }

  const profile = await Instructor.findOne({ _id: req.params.id, status: "Active" })
    .select("user")
    .lean();

  if (!profile) {
    res.status(404);
    throw new Error("Instructor not found");
  }

  const { page, limit } = parsePaging(req.query);
  const match = { instructor: profile.user, status: "published" };

  const [summary, total, rows] = await Promise.all([
    buildSummary(match, "instructorRating"),
    Review.countDocuments(match),
    Review.find(match)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("student", "name")
      .populate("course", "title")
      .lean(),
  ]);

  res.json({
    success: true,
    summary,
    reviews: rows.map((row) => ({
      id: String(row._id),
      name: publicName(row.student?.name),
      rating: row.instructorRating,
      comment: row.instructorComment || "",
      context: row.course?.title || "",
      createdAt: row.createdAt,
    })),
    pagination: pagination(page, limit, total),
  });
});

/* ------------------------------------------------------------------ */
/* STUDENT                                                             */
/* ------------------------------------------------------------------ */

// @route GET /api/reviews/course/:courseId/me
// Tells the UI whether this user may review the course, plus their review.
const getMyCourseReview = asyncHandler(async (req, res) => {
  const result = await checkEligibility(req.user, req.params.courseId);

  if (result.notFound) {
    res.status(404);
    throw new Error("Course not found");
  }

  const review = result.eligible
    ? await Review.findOne({ course: result.course._id, student: req.user._id })
    : null;

  res.json({
    success: true,
    eligible: result.eligible,
    reason: result.reason || "",
    review,
  });
});

// @route PUT /api/reviews/course/:courseId   (create or update own review)
const saveMyReview = asyncHandler(async (req, res) => {
  const result = await checkEligibility(req.user, req.params.courseId);

  if (result.notFound) {
    res.status(404);
    throw new Error("Course not found");
  }
  if (!result.eligible) {
    res.status(403);
    throw new Error(result.reason);
  }

  const courseRating = asRating(req.body?.courseRating);
  const instructorRating = asRating(req.body?.instructorRating);
  const courseComment = String(req.body?.courseComment ?? "").trim();
  const instructorComment = String(req.body?.instructorComment ?? "").trim();

  if (!courseRating) {
    res.status(400);
    throw new Error("Please rate the course from 1 to 5 stars.");
  }
  if (!instructorRating) {
    res.status(400);
    throw new Error("Please rate the instructor from 1 to 5 stars.");
  }
  if (courseComment.length > MAX_COMMENT || instructorComment.length > MAX_COMMENT) {
    res.status(400);
    throw new Error(`Comments can be at most ${MAX_COMMENT} characters.`);
  }

  const { course } = result;

  let review = await Review.findOne({ course: course._id, student: req.user._id });
  const created = !review;
  const previousInstructor = review ? String(review.instructor) : null;

  if (!review) {
    review = new Review({ course: course._id, student: req.user._id });
  }

  review.instructor = course.instructor;
  review.courseRating = courseRating;
  review.courseComment = courseComment;
  review.instructorRating = instructorRating;
  review.instructorComment = instructorComment;
  // status is untouched: editing a review an admin hid does not unhide it

  try {
    await review.save();
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error("You have already reviewed this course.");
    }
    throw err;
  }

  const refreshes = [
    refreshCourseRating(course._id),
    refreshInstructorRating(course.instructor),
  ];
  if (previousInstructor && previousInstructor !== String(course.instructor)) {
    refreshes.push(refreshInstructorRating(previousInstructor));
  }
  await Promise.all(refreshes);

  res.status(created ? 201 : 200).json({ success: true, review });
});

// @route DELETE /api/reviews/course/:courseId
const deleteMyReview = asyncHandler(async (req, res) => {
  if (!isId(req.params.courseId)) {
    res.status(404);
    throw new Error("Review not found");
  }

  const review = await Review.findOneAndDelete({
    course: req.params.courseId,
    student: req.user._id,
  });

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  await Promise.all([
    refreshCourseRating(review.course),
    refreshInstructorRating(review.instructor),
  ]);

  res.json({ success: true, message: "Review deleted" });
});

// @route GET /api/reviews/mine
// The student's reviews, plus enrolled courses they haven't reviewed yet.
const getMyReviews = asyncHandler(async (req, res) => {
  const [reviews, enrollments] = await Promise.all([
    Review.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .populate("course", "title thumbnail")
      .populate("instructor", "name")
      .lean(),
    CourseEnrollment.find({
      status: { $in: COUNTED_ENROLLMENT_STATUSES },
      $or: [
        { user: req.user._id },
        { studentEmail: String(req.user.email || "").toLowerCase() },
      ],
    })
      .select("course")
      .lean(),
  ]);

  const reviewedIds = new Set(reviews.map((r) => String(r.course?._id || r.course)));
  const enrolledIds = [...new Set(enrollments.map((e) => String(e.course)))];

  const pendingCourses = await Course.find({
    _id: { $in: enrolledIds.filter((id) => !reviewedIds.has(id)) },
    status: { $ne: "Draft" },
  })
    .select("title thumbnail instructor")
    .populate("instructor", "name")
    .lean();

  res.json({
    success: true,
    reviews: reviews
      .filter((r) => r.course)
      .map((r) => ({
        id: String(r._id),
        course: {
          id: String(r.course._id),
          title: r.course.title,
          thumbnail: r.course.thumbnail || "",
        },
        instructorName: r.instructor?.name || "Instructor",
        courseRating: r.courseRating,
        courseComment: r.courseComment,
        instructorRating: r.instructorRating,
        instructorComment: r.instructorComment,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    pending: pendingCourses.map((c) => ({
      id: String(c._id),
      title: c.title,
      thumbnail: c.thumbnail || "",
      instructorName: c.instructor?.name || "Instructor",
    })),
  });
});

/* ------------------------------------------------------------------ */
/* INSTRUCTOR                                                          */
/* ------------------------------------------------------------------ */

// @route GET /api/reviews/received?page=&limit=&course=
const getReceivedReviews = asyncHandler(async (req, res) => {
  const { page, limit } = parsePaging(req.query);
  const base = { instructor: toId(req.user._id), status: "published" };

  const listMatch = { ...base };
  if (req.query.course && isId(req.query.course)) {
    listMatch.course = toId(req.query.course);
  }

  const [total, rows, courseSummary, instructorSummary, byCourse] = await Promise.all([
    Review.countDocuments(listMatch),
    Review.find(listMatch)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("student", "name")
      .populate("course", "title")
      .lean(),
    buildSummary(base, "courseRating"),
    buildSummary(base, "instructorRating"),
    Review.aggregate([
      { $match: base },
      {
        $group: {
          _id: "$course",
          average: { $avg: "$courseRating" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      { $project: { title: "$course.title", average: 1, count: 1 } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.json({
    success: true,
    courseSummary,
    instructorSummary,
    byCourse: byCourse.map((row) => ({
      id: String(row._id),
      title: row.title,
      average: Math.round(row.average * 10) / 10,
      count: row.count,
    })),
    reviews: rows.map((row) => ({
      id: String(row._id),
      name: publicName(row.student?.name),
      courseId: row.course ? String(row.course._id) : "",
      courseTitle: row.course?.title || "Deleted course",
      courseRating: row.courseRating,
      courseComment: row.courseComment || "",
      instructorRating: row.instructorRating,
      instructorComment: row.instructorComment || "",
      createdAt: row.createdAt,
    })),
    pagination: pagination(page, limit, total),
  });
});

/* ------------------------------------------------------------------ */
/* ADMIN                                                               */
/* ------------------------------------------------------------------ */

// @route GET /api/reviews/admin?page=&limit=&status=&lowRated=true
const getAdminReviews = asyncHandler(async (req, res) => {
  const { page, limit } = parsePaging(req.query, 10, 50);

  const match = {};
  if (["published", "hidden"].includes(req.query.status)) {
    match.status = req.query.status;
  }
  if (req.query.lowRated === "true") {
    match.$or = [{ courseRating: { $lte: 2 } }, { instructorRating: { $lte: 2 } }];
  }

  const [total, rows, totals, hidden] = await Promise.all([
    Review.countDocuments(match),
    Review.find(match)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("student", "name email")
      .populate("course", "title")
      .populate("instructor", "name")
      .lean(),
    Review.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          courseAverage: { $avg: "$courseRating" },
          instructorAverage: { $avg: "$instructorRating" },
        },
      },
    ]),
    Review.countDocuments({ status: "hidden" }),
  ]);

  const t = totals[0] || {};
  const round1 = (v) => Math.round((v || 0) * 10) / 10;

  res.json({
    success: true,
    reviews: rows.map((row) => ({
      id: String(row._id),
      studentName: row.student?.name || "Deleted user",
      studentEmail: row.student?.email || "",
      courseTitle: row.course?.title || "Deleted course",
      instructorName: row.instructor?.name || "Deleted user",
      courseRating: row.courseRating,
      courseComment: row.courseComment,
      instructorRating: row.instructorRating,
      instructorComment: row.instructorComment,
      status: row.status,
      createdAt: row.createdAt,
    })),
    pagination: pagination(page, limit, total),
    stats: {
      total: t.count || 0,
      hidden,
      courseAverage: round1(t.courseAverage),
      instructorAverage: round1(t.instructorAverage),
    },
  });
});

// @route PATCH /api/reviews/admin/:id   { status: "published" | "hidden" }
const setReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};

  if (!isId(req.params.id)) {
    res.status(404);
    throw new Error("Review not found");
  }
  if (!["published", "hidden"].includes(status)) {
    res.status(400);
    throw new Error("Status must be 'published' or 'hidden'.");
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  review.status = status;
  await review.save();

  await Promise.all([
    refreshCourseRating(review.course),
    refreshInstructorRating(review.instructor),
  ]);

  res.json({ success: true, review: { id: String(review._id), status } });
});

// @route DELETE /api/reviews/admin/:id
const deleteReviewAdmin = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) {
    res.status(404);
    throw new Error("Review not found");
  }

  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  await Promise.all([
    refreshCourseRating(review.course),
    refreshInstructorRating(review.instructor),
  ]);

  res.json({ success: true, message: "Review deleted" });
});

export {
  getCourseReviews,
  getInstructorReviews,
  getMyCourseReview,
  saveMyReview,
  deleteMyReview,
  getMyReviews,
  getReceivedReviews,
  getAdminReviews,
  setReviewStatus,
  deleteReviewAdmin,
};
