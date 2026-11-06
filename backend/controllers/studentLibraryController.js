import asyncHandler from "express-async-handler";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";

const COUNTED_ENROLLMENT_STATUSES = ["active", "completed"];

const userName = (user) =>
  user?.name ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  "SAGE Instructor";

// GET /api/student/library
export const getLibraryCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ status: "Published" })
    .select(
      "title shortDescription description category level duration price rating thumbnail instructor createdAt modules.lessons._id",
    )
    .populate("instructor", "name firstName lastName")
    .sort({ createdAt: -1 })
    .lean();

  const courseIds = courses.map((course) => course._id);

  const counts = courseIds.length
    ? await CourseEnrollment.aggregate([
        {
          $match: {
            course: { $in: courseIds },
            status: { $in: COUNTED_ENROLLMENT_STATUSES },
          },
        },
        { $group: { _id: "$course", students: { $sum: 1 } } },
      ])
    : [];

  const studentsByCourse = new Map(
    counts.map((row) => [String(row._id), row.students]),
  );

  const items = courses.map((course) => {
    const key = String(course._id);
    const lessons = (course.modules || []).reduce(
      (total, courseModule) => total + (courseModule.lessons || []).length,
      0,
    );

    return {
      id: key,
      title: course.title,
      description: String(
        course.shortDescription || course.description || "",
      ).slice(0, 220),
      category: course.category || "General",
      instructor: userName(course.instructor),
      level: course.level || "All Levels",
      duration: course.duration || "Self-paced",
      lessons,
      students: studentsByCourse.get(key) || 0,
      rating: course.rating || 0,
      price: Number(course.price || 0),
      image: course.thumbnail || "",
      createdAt: course.createdAt,
    };
  });

  res.json({ success: true, courses: items });
});
