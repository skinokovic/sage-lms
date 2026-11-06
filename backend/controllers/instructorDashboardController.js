import asyncHandler from "express-async-handler";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Certificate from "../models/Certificate.js";
import Progress from "../models/Progress.js";
import Schedule from "../models/Schedule.js";

const COUNTED_ENROLLMENT_STATUSES = ["active", "completed"];
const DAY_MS = 24 * 60 * 60 * 1000;

const emptyResponse = () => ({
  success: true,
  stats: {
    courses: 0,
    publishedCourses: 0,
    students: 0,
    studentsTrend: null,
    assignments: 0,
    pendingReviews: 0,
  },
  courses: [],
  activities: [],
  nextClass: null,
  performance: { completion: null, submissionRate: null, engagement: null },
});

// GET /api/instructor/dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const now = Date.now();

  const courses = await Course.find({ instructor: instructorId })
    .select("title category duration status updatedAt modules.lessons._id")
    .sort({ updatedAt: -1 })
    .lean();

  if (courses.length === 0) {
    return res.json(emptyResponse());
  }

  const courseIds = courses.map((course) => course._id);

  const [enrollments, assignments, doneRows, activeUserIds, nextSchedule] =
    await Promise.all([
      CourseEnrollment.find({
        course: { $in: courseIds },
        status: { $in: COUNTED_ENROLLMENT_STATUSES },
      })
        .select("course user studentEmail studentName enrolledAt createdAt")
        .lean(),
      Assignment.find({ instructor: instructorId })
        .select("title status course")
        .lean(),
      Progress.aggregate([
        { $match: { courseId: { $in: courseIds }, completed: true } },
        { $group: { _id: "$courseId", done: { $sum: 1 } } },
      ]),
      Progress.distinct("userId", {
        courseId: { $in: courseIds },
        completed: true,
        completedAt: { $gte: new Date(now - 30 * DAY_MS) },
      }),
      Schedule.findOne({
        instructor: instructorId,
        status: "Scheduled",
        endsAt: { $gte: new Date() },
      })
        .sort({ startsAt: 1 })
        .populate("course", "title")
        .lean(),
    ]);

  const assignmentIds = assignments.map((assignment) => assignment._id);

  const [submissionTotals, recentSubmissions, recentCertificates] =
    await Promise.all([
      assignmentIds.length
        ? AssignmentSubmission.aggregate([
            { $match: { assignment: { $in: assignmentIds } } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                  $sum: {
                    $cond: [{ $in: ["$status", ["Submitted", "Late"]] }, 1, 0],
                  },
                },
              },
            },
          ])
        : [],
      assignmentIds.length
        ? AssignmentSubmission.find({ assignment: { $in: assignmentIds } })
            .sort({ submittedAt: -1 })
            .limit(5)
            .populate("student", "name")
            .select("assignment student submittedAt")
            .lean()
        : [],
      Certificate.find({ courseId: { $in: courseIds } })
        .sort({ issuedAt: -1 })
        .limit(5)
        .select("studentName courseTitle issuedAt")
        .lean(),
    ]);

  /* ------------------------------ students ------------------------------ */

  const studentKey = (enrollment) =>
    enrollment.user
      ? String(enrollment.user)
      : enrollment.studentEmail || String(enrollment._id);

  const enrolledAt = (enrollment) =>
    new Date(enrollment.enrolledAt || enrollment.createdAt).getTime();

  const uniqueStudents = new Set(enrollments.map(studentKey));

  const last30 = enrollments.filter(
    (enrollment) => enrolledAt(enrollment) >= now - 30 * DAY_MS,
  ).length;
  const previous30 = enrollments.filter(
    (enrollment) =>
      enrolledAt(enrollment) >= now - 60 * DAY_MS &&
      enrolledAt(enrollment) < now - 30 * DAY_MS,
  ).length;

  let studentsTrend = null;
  if (previous30 > 0) {
    const change = ((last30 - previous30) / previous30) * 100;
    studentsTrend = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  } else if (last30 > 0) {
    studentsTrend = `+${last30} new`;
  }

  const studentsByCourse = new Map();
  enrollments.forEach((enrollment) => {
    const key = String(enrollment.course);
    studentsByCourse.set(key, (studentsByCourse.get(key) || 0) + 1);
  });

  const doneByCourse = new Map(
    doneRows.map((row) => [String(row._id), row.done]),
  );

  /* ------------------------------- courses ------------------------------- */

  let possibleLessons = 0;
  let doneLessons = 0;

  const courseItems = courses.map((course) => {
    const key = String(course._id);
    const lessons = (course.modules || []).reduce(
      (total, courseModule) => total + (courseModule.lessons || []).length,
      0,
    );
    const students = studentsByCourse.get(key) || 0;

    possibleLessons += students * lessons;
    doneLessons += doneByCourse.get(key) || 0;

    return {
      id: key,
      title: course.title,
      category: course.category || "General",
      students,
      lessons,
      duration: course.duration || "Self-paced",
      status: course.status,
    };
  });

  /* ------------------------------ performance ------------------------------ */

  const completion =
    possibleLessons > 0
      ? Math.min(100, Math.round((doneLessons / possibleLessons) * 100))
      : null;

  // Submissions received vs. submissions expected on live assignments
  const liveAssignments = assignments.filter(
    (assignment) => assignment.status !== "Draft",
  );
  const expected = liveAssignments.reduce(
    (total, assignment) =>
      total + (studentsByCourse.get(String(assignment.course)) || 0),
    0,
  );
  const totals = submissionTotals[0] || { total: 0, pending: 0 };
  const submissionRate =
    expected > 0
      ? Math.min(100, Math.round((totals.total / expected) * 100))
      : null;

  // Enrolled students who completed a lesson in the last 30 days
  const enrolledUsers = new Set(
    enrollments
      .filter((enrollment) => enrollment.user)
      .map((enrollment) => String(enrollment.user)),
  );
  const engagedUsers = activeUserIds.filter((id) =>
    enrolledUsers.has(String(id)),
  );
  const engagement =
    enrolledUsers.size > 0
      ? Math.min(
          100,
          Math.round((engagedUsers.length / enrolledUsers.size) * 100),
        )
      : null;

  /* -------------------------------- activity -------------------------------- */

  const assignmentTitle = new Map(
    assignments.map((assignment) => [String(assignment._id), assignment.title]),
  );
  const courseTitle = new Map(
    courses.map((course) => [String(course._id), course.title]),
  );

  const activities = [
    ...recentSubmissions.map((submission) => ({
      type: "assignment",
      title: "New assignment submission",
      description: `${submission.student?.name || "A student"} submitted ${
        assignmentTitle.get(String(submission.assignment)) || "an assignment"
      }`,
      at: submission.submittedAt,
    })),
    ...[...enrollments]
      .sort((a, b) => enrolledAt(b) - enrolledAt(a))
      .slice(0, 5)
      .map((enrollment) => ({
        type: "enrollment",
        title: "New student enrolled",
        description: `${
          enrollment.studentName || enrollment.studentEmail || "A student"
        } joined ${courseTitle.get(String(enrollment.course)) || "a course"}`,
        at: new Date(enrolledAt(enrollment)),
      })),
    ...recentCertificates.map((certificate) => ({
      type: "completion",
      title: "Course completed",
      description: `${certificate.studentName || "A student"} completed ${
        certificate.courseTitle || "a course"
      }`,
      at: certificate.issuedAt,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6);

  /* ------------------------------- next class ------------------------------- */

  const nextClass = nextSchedule
    ? {
        id: String(nextSchedule._id),
        title: nextSchedule.title,
        course: nextSchedule.course?.title || "Course",
        type: nextSchedule.type,
        mode: nextSchedule.mode,
        location: nextSchedule.location,
        meetingLink:
          nextSchedule.mode === "Online" ? nextSchedule.meetingLink : "",
        startsAt: nextSchedule.startsAt,
        endsAt: nextSchedule.endsAt,
        live: new Date(nextSchedule.startsAt).getTime() <= now,
      }
    : null;

  res.json({
    success: true,
    stats: {
      courses: courses.length,
      publishedCourses: courses.filter(
        (course) => course.status === "Published",
      ).length,
      students: uniqueStudents.size,
      studentsTrend,
      assignments: assignments.filter(
        (assignment) => assignment.status === "Published",
      ).length,
      pendingReviews: totals.pending,
    },
    courses: courseItems.slice(0, 5),
    activities,
    nextClass,
    performance: { completion, submissionRate, engagement },
  });
});
