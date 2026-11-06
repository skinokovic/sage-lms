import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Progress from "../models/Progress.js";
import cloudinary from "../utils/cloudinary.js";
import Instructor from "../models/Instructor.js";

// Enrollments with these statuses count as students on a course.
const COUNTED_ENROLLMENT_STATUSES = ["active", "completed"];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ensureOwnership = (course, user) => {
  if (user.role === "admin") return true;
  const instructorId = course.instructor?._id || course.instructor;
  return instructorId.toString() === user._id.toString();
};

const buildCourseQuery = ({ status, category, level, search }) => {
  const query = {};
  if (status && status !== "All") query.status = status;
  if (category && category !== "All") query.category = category;
  if (level && level !== "All") query.level = level;
  if (search) query.$text = { $search: search };
  return query;
};

// @desc    Get published courses for the public course catalogue
// @route   GET /api/courses/public
// @access  Public
const getPublishedCourses = asyncHandler(async (req, res) => {
  const query = {
    status: "Published",
  };

  if (req.query.category && req.query.category !== "All") {
    query.category = req.query.category;
  }

  if (req.query.level && req.query.level !== "All") {
    query.level = req.query.level;
  }

  // Escape special regex characters so search input is treated as text.
  if (req.query.search?.trim()) {
    const escapedSearch = escapeRegex(req.query.search.trim());

    query.$or = [
      { title: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
      { category: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const courses = await Course.find(query)
    .populate("instructor", "name email avatarUrl")
    .sort({ updatedAt: -1 })
    .lean();

  res.json({
    success: true,
    count: courses.length,
    courses,
  });
});

// @desc    Get one published course for public course details
// @route   GET /api/courses/public/:id
// @access  Public
// const getPublishedCourseById = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     res.status(404);
//     throw new Error("Course not found");
//   }

//   const course = await Course.findOne({
//     _id: id,
//     status: "Published",
//   }).populate("instructor", "name email avatarUrl");

//   if (!course) {
//     res.status(404);
//     throw new Error("Published course not found");
//   }

//   res.json({
//     success: true,
//     course,
//   });
// });

const getPublishedCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404);
    throw new Error("Course not found");
  }

  const course = await Course.findOne({
    _id: id,
    status: "Published",
  }).populate("instructor", "name avatarUrl");

  if (!course) {
    res.status(404);
    throw new Error("Published course not found");
  }

  const instructorId = course.instructor?._id;

  const [profile, publishedCount] = instructorId
    ? await Promise.all([
        Instructor.findOne({ user: instructorId })
          .select("specialization bio rating ratingCount")
          .lean(),
        Course.countDocuments({
          instructor: instructorId,
          status: "Published",
        }),
      ])
    : [null, 0];

  const data = course.toJSON();
  data.instructor = {
    ...(data.instructor || {}),
    title: profile?.specialization || "",
    bio: profile?.bio || "",
    rating: profile?.rating || 0,
    ratingCount: profile?.ratingCount || 0,
    courseCount: publishedCount,
  };

  res.json({ success: true, course: data });
});

// @desc    Create a course
// @route   POST /api/courses
// @access  Private (instructor, admin)
const createCourse = asyncHandler(async (req, res) => {
  const {
    title,
    shortDescription,
    description,
    category,
    level,
    duration,
    language,
    price,
    thumbnail,
    objectives,
    prerequisites,
    status,
    instructor, // admin-only: assign to a specific instructor instead of self
  } = req.body;

  if (!title || !description || !category) {
    res.status(400);
    throw new Error("Title, description and category are required");
  }

  const instructorId =
    req.user.role === "admin" && instructor ? instructor : req.user._id;

  const course = await Course.create({
    title,
    shortDescription,
    description,
    category,
    level,
    duration,
    language,
    price,
    thumbnail,
    objectives,
    prerequisites,
    // Only Draft or Published can be chosen when creating; anything else is a Draft.
    status: ["Draft", "Published"].includes(status) ? status : "Draft",
    instructor: instructorId,
  });

  res.status(201).json({ success: true, course });
});

// @desc    Get the logged-in instructor's own courses, with live stats
// @route   GET /api/courses/mine?page=&limit=&search=&status=&category=&level=
// @access  Private (instructor)
//
// Returns lightweight rows (no modules/lessons payload) plus:
//   - students:   active/completed enrollments per course
//   - lessons:    total lessons counted from the embedded modules
//   - completion: completed lessons / (students x lessons), as a percentage
//   - stats:      totals across ALL of the instructor's courses (ignores filters)
const getMyCourses = asyncHandler(async (req, res) => {
  const instructorId = new mongoose.Types.ObjectId(req.user._id);

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const { status, category, level, search } = req.query;
  const match = { instructor: instructorId };
  if (status && status !== "All") match.status = status;
  if (category && category !== "All") match.category = category;
  if (level && level !== "All") match.level = level;
  if (search?.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), "i");
    match.$or = [{ title: pattern }, { category: pattern }, { level: pattern }];
  }

  const [total, rows, statusCounts, categories, ownCourseIds] =
    await Promise.all([
      Course.countDocuments(match),
      Course.aggregate([
        { $match: match },
        { $sort: { updatedAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $project: {
            title: 1,
            category: 1,
            level: 1,
            duration: 1,
            price: 1,
            status: 1,
            rating: 1,
            thumbnail: 1,
            createdAt: 1,
            updatedAt: 1,
            moduleCount: { $size: { $ifNull: ["$modules", []] } },
            lessonCount: {
              $sum: {
                $map: {
                  input: { $ifNull: ["$modules", []] },
                  as: "m",
                  in: { $size: { $ifNull: ["$$m.lessons", []] } },
                },
              },
            },
          },
        },
      ]),
      Course.aggregate([
        { $match: { instructor: instructorId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Course.distinct("category", { instructor: instructorId }),
      Course.distinct("_id", { instructor: instructorId }),
    ]);

  const pageCourseIds = rows.map((row) => row._id);

  const [enrollmentCounts, progressCounts, totalStudents] = await Promise.all([
    CourseEnrollment.aggregate([
      {
        $match: {
          course: { $in: pageCourseIds },
          status: { $in: COUNTED_ENROLLMENT_STATUSES },
        },
      },
      { $group: { _id: "$course", students: { $sum: 1 } } },
    ]),
    Progress.aggregate([
      { $match: { courseId: { $in: pageCourseIds }, completed: true } },
      { $group: { _id: "$courseId", done: { $sum: 1 } } },
    ]),
    CourseEnrollment.countDocuments({
      course: { $in: ownCourseIds },
      status: { $in: COUNTED_ENROLLMENT_STATUSES },
    }),
  ]);

  const studentsByCourse = new Map(
    enrollmentCounts.map((item) => [String(item._id), item.students]),
  );
  const doneByCourse = new Map(
    progressCounts.map((item) => [String(item._id), item.done]),
  );

  const courses = rows.map((row) => {
    const key = String(row._id);
    const students = studentsByCourse.get(key) || 0;
    const done = doneByCourse.get(key) || 0;
    const possible = students * row.lessonCount;
    const completion =
      possible > 0 ? Math.min(100, Math.round((done / possible) * 100)) : 0;

    return {
      id: key,
      title: row.title,
      category: row.category,
      level: row.level,
      duration: row.duration || "",
      price: row.price || 0,
      status: row.status,
      rating: row.rating || 0,
      thumbnail: row.thumbnail || "",
      students,
      moduleCount: row.moduleCount,
      lessons: row.lessonCount,
      completion,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });

  const byStatus = Object.fromEntries(
    statusCounts.map((item) => [item._id, item.count]),
  );

  res.json({
    success: true,
    courses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
    stats: {
      total: ownCourseIds.length,
      published: byStatus.Published || 0,
      drafts: byStatus.Draft || 0,
      archived: byStatus.Archived || 0,
      totalStudents,
    },
    categories: categories.sort((a, b) => a.localeCompare(b)),
  });
});

// @desc    Get every course, across all instructors
// @route   GET /api/courses
// @access  Private (admin)
const getAllCourses = asyncHandler(async (req, res) => {
  const query = buildCourseQuery(req.query);

  if (req.query.instructor) query.instructor = req.query.instructor;

  const courses = await Course.find(query)
    .populate("instructor", "name email avatarUrl")
    .sort({ updatedAt: -1 });

  res.json({ success: true, courses });
});

// @desc    Get a single course
// @route   GET /api/courses/:id
// @access  Private (owning instructor or admin)
const getCourseById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404);
    throw new Error("Course not found");
  }

  const course = await Course.findById(req.params.id).populate(
    "instructor",
    "name email avatarUrl",
  );

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (!ensureOwnership(course, req.user)) {
    res.status(403);
    throw new Error("You do not have access to this course");
  }

  const students = await CourseEnrollment.countDocuments({
    course: course._id,
    status: { $in: COUNTED_ENROLLMENT_STATUSES },
  });

  res.json({ success: true, course, stats: { students } });
});

// @desc    Update a course — details and/or the full curriculum
// @route   PATCH /api/courses/:id
// @access  Private (owning instructor or admin)
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (!ensureOwnership(course, req.user)) {
    res.status(403);
    throw new Error("You do not have access to this course");
  }

  const updatable = [
    "title",
    "shortDescription",
    "description",
    "category",
    "level",
    "duration",
    "language",
    "price",
    "status",
    "thumbnail",
    "objectives", // fixed: this key had a leading space, so it never saved
    "prerequisites",
    "modules",
  ];

  updatable.forEach((field) => {
    if (req.body[field] !== undefined) {
      course[field] = req.body[field];
    }
  });

  await course.save();

  res.json({ success: true, course });
});

// @desc    Delete a course (archives it instead when students are enrolled)
// @route   DELETE /api/courses/:id
// @access  Private (owning instructor or admin)
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (!ensureOwnership(course, req.user)) {
    res.status(403);
    throw new Error("You do not have access to this course");
  }

  // Never hard-delete a course people have paid for.
  const enrolled = await CourseEnrollment.countDocuments({
    course: course._id,
  });

  if (enrolled > 0) {
    course.status = "Archived";
    await course.save();

    return res.json({
      success: true,
      archived: true,
      message:
        "This course has enrolled students, so it was archived instead of deleted.",
    });
  }

  if (course.thumbnailPublicId) {
    await cloudinary.uploader.destroy(course.thumbnailPublicId).catch(() => {});
  }

  await course.deleteOne();

  res.json({ success: true, archived: false, message: "Course deleted" });
});

// Finds the student's active enrollment for a course (by account id, or by
// email for enrollments created from a payment).
const findActiveEnrollment = (courseId, user) =>
  CourseEnrollment.findOne({
    course: courseId,
    status: { $in: COUNTED_ENROLLMENT_STATUSES },
    $or: [
      { user: user._id },
      { studentEmail: String(user.email || "").toLowerCase() },
    ],
  });

// @desc    Load a course for the learning player, plus the caller's progress
// @route   GET /api/courses/:id/learn
// @access  Private (owning instructor / admin = preview, enrolled student = tracked)
const getCourseForLearning = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404);
    throw new Error("Course not found");
  }

  const course = await Course.findById(req.params.id).populate(
    "instructor",
    "name email avatarUrl",
  );

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  let canTrack = false;

  if (ensureOwnership(course, req.user)) {
    // Instructor/admin preview: allowed, but progress is not recorded.
    canTrack = false;
  } else if (req.user.role === "student") {
    const enrollment = await findActiveEnrollment(course._id, req.user);

    if (!enrollment || course.status === "Draft") {
      res.status(403);
      throw new Error("You are not enrolled in this course");
    }
    canTrack = true;
  } else {
    res.status(403);
    throw new Error("You do not have access to this course");
  }

  let completedLessonIds = [];
  if (canTrack) {
    const rows = await Progress.find({
      userId: req.user._id,
      courseId: course._id,
      completed: true,
    })
      .select("lessonId")
      .lean();
    completedLessonIds = rows.map((row) => String(row.lessonId));
  }

  res.json({
    success: true,
    course,
    progress: { canTrack, completedLessonIds },
  });
});

// @desc    Mark a lesson as completed for the logged-in student
// @route   POST /api/courses/:id/lessons/:lessonId/complete
// @access  Private (enrolled student)
const markLessonComplete = asyncHandler(async (req, res) => {
  const { id, lessonId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    !mongoose.Types.ObjectId.isValid(lessonId)
  ) {
    res.status(404);
    throw new Error("Lesson not found");
  }

  const course = await Course.findById(id).select("modules status");

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (req.user.role !== "student") {
    res.status(403);
    throw new Error("Only enrolled students can record progress");
  }

  const enrollment = await findActiveEnrollment(course._id, req.user);

  if (!enrollment || course.status === "Draft") {
    res.status(403);
    throw new Error("You are not enrolled in this course");
  }

  const allLessonIds = (course.modules || []).flatMap((courseModule) =>
    (courseModule.lessons || []).map((lesson) => String(lesson._id)),
  );

  if (!allLessonIds.includes(String(lessonId))) {
    res.status(404);
    throw new Error("Lesson not found in this course");
  }

  await Progress.findOneAndUpdate(
    { userId: req.user._id, courseId: course._id, lessonId },
    { $set: { completed: true, completedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const rows = await Progress.find({
    userId: req.user._id,
    courseId: course._id,
    completed: true,
  })
    .select("lessonId")
    .lean();

  const completedLessonIds = rows
    .map((row) => String(row.lessonId))
    .filter((value) => allLessonIds.includes(value));

  // Everything done: flag the enrollment as completed.
  if (
    allLessonIds.length > 0 &&
    completedLessonIds.length >= allLessonIds.length
  ) {
    await CourseEnrollment.updateOne(
      { _id: enrollment._id },
      { $set: { status: "completed" } },
    );
  }

  res.json({ success: true, completedLessonIds });
});

// @desc    Upload (or replace) a course thumbnail
// @route   POST /api/courses/:id/thumbnail
// @access  Private (owning instructor or admin)
const uploadThumbnail = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (!ensureOwnership(course, req.user)) {
    res.status(403);
    throw new Error("You do not have access to this course");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("No image file was uploaded");
  }

  if (course.thumbnailPublicId) {
    await cloudinary.uploader.destroy(course.thumbnailPublicId).catch(() => {});
  }

  course.thumbnail = req.file.path;
  course.thumbnailPublicId = req.file.filename;

  await course.save();

  res.json({ success: true, course });
});

// @desc    Upload a lesson video (or other media) and return its URL
// @route   POST /api/courses/upload/video
// @access  Private (instructor, admin)
const uploadMediaAsset = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No video file was uploaded");
  }

  res.json({
    success: true,
    url: req.file.path,
    publicId: req.file.filename,
  });
});

export {
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
};
