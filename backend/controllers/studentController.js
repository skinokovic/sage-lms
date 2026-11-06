import asyncHandler from "express-async-handler";
import Course from "../models/Course.js"; // keeps the model registered for populate
import CourseEnrollment from "../models/CourseEnrollment.js";
import Progress from "../models/Progress.js";
import User from "../models/User.js";

const TZ = "Africa/Lagos";

const dayKey = (date) =>
  new Date(date).toLocaleDateString("en-CA", { timeZone: TZ });

const formatLastAccessed = (date) => {
  if (!date) return "Not started";

  const key = dayKey(date);
  if (key === dayKey(new Date())) return "Today";
  if (key === dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000)))
    return "Yesterday";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: TZ,
  });
};

const isObjectId = (value) => value && value._bsontype === "ObjectId";

const displayName = (user) =>
  user?.name ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.email ||
  "Instructor";

const getImage = (course) => {
  const thumb = course.thumbnail ?? course.image ?? course.thumbnailUrl;
  if (!thumb) return "";
  return typeof thumb === "string"
    ? thumb
    : thumb.url || thumb.secure_url || "";
};

const getLessonIds = (course) =>
  (course.modules || []).flatMap((module) =>
    (module.lessons || []).map((lesson) => String(lesson._id)),
  );

// GET /api/student/courses
export const getMyCourses = asyncHandler(async (req, res) => {
  const email = req.user.email.toLowerCase();

  // Guest checkout enrols by email, so match on user id OR email.
  const enrollments = await CourseEnrollment.find({
    status: { $ne: "revoked" },
    $or: [{ user: req.user._id }, { studentEmail: email }],
  })
    .populate("course")
    .sort({ enrolledAt: -1 })
    .lean();

  const seen = new Set();
  const active = enrollments.filter((enrollment) => {
    if (!enrollment.course) return false; // course was deleted
    const id = String(enrollment.course._id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  if (active.length === 0) {
    return res.json({ success: true, courses: [] });
  }

  const courseIds = active.map((enrollment) => enrollment.course._id);
  const instructorIds = active
    .map((enrollment) => enrollment.course.instructor)
    .filter(isObjectId);

  const [progressDocs, studentCounts, instructors] = await Promise.all([
    Progress.find({ userId: req.user._id, courseId: { $in: courseIds } })
      .select("courseId lessonId completed updatedAt")
      .lean(),
    CourseEnrollment.aggregate([
      {
        $match: { course: { $in: courseIds }, status: { $ne: "revoked" } },
      },
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]),
    instructorIds.length
      ? User.find({ _id: { $in: instructorIds } })
          .select("name firstName lastName email")
          .lean()
      : [],
  ]);

  const progressByCourse = new Map();
  for (const doc of progressDocs) {
    const key = String(doc.courseId);
    const entry = progressByCourse.get(key) || {
      done: new Set(),
      lastAt: null,
    };
    if (doc.completed) entry.done.add(String(doc.lessonId));
    if (!entry.lastAt || doc.updatedAt > entry.lastAt)
      entry.lastAt = doc.updatedAt;
    progressByCourse.set(key, entry);
  }

  const countByCourse = new Map(
    studentCounts.map((row) => [String(row._id), row.count]),
  );
  const instructorById = new Map(
    instructors.map((user) => [String(user._id), displayName(user)]),
  );

  const courses = active.map(({ course }) => {
    const key = String(course._id);
    const entry = progressByCourse.get(key);

    const lessonIds = getLessonIds(course);
    const totalLessons = lessonIds.length;
    // Only count lessons that still exist in the course
    const completedLessons = entry
      ? lessonIds.filter((id) => entry.done.has(id)).length
      : 0;

    const progress = totalLessons
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    let status = "Not Started";
    if (totalLessons > 0 && completedLessons >= totalLessons)
      status = "Completed";
    else if (completedLessons > 0) status = "In Progress";

    let instructor = "Instructor";
    if (isObjectId(course.instructor))
      instructor = instructorById.get(String(course.instructor)) || instructor;
    else if (typeof course.instructor === "string" && course.instructor)
      instructor = course.instructor;
    else if (course.instructor?.name) instructor = course.instructor.name;

    return {
      id: key,
      title: course.title,
      category: course.category || "General",
      instructor,
      image: getImage(course),
      progress,
      completedLessons,
      totalLessons,
      duration: course.duration || "Self-paced",
      students: countByCourse.get(key) || 0,
      status,
      lastAccessed: formatLastAccessed(entry?.lastAt),
    };
  });

  res.json({ success: true, courses });
});
