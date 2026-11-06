import asyncHandler from "express-async-handler";
import NotificationState from "../models/NotificationState.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Certificate from "../models/Certificate.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Schedule from "../models/Schedule.js";
import { getEnrolledCourseIds } from "../utils/studentEnrollments.js";

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const COUNTED_ENROLLMENT_STATUSES = ["active", "completed"];
const MAX_ITEMS = 15;

/* -------------------------------- instructor -------------------------------- */

const instructorFeed = async (user, since) => {
  const [assignments, courses] = await Promise.all([
    Assignment.find({ instructor: user._id }).select("title").lean(),
    Course.find({ instructor: user._id }).select("title").lean(),
  ]);

  const assignmentIds = assignments.map((item) => item._id);
  const courseIds = courses.map((item) => item._id);

  const assignmentTitle = new Map(
    assignments.map((item) => [String(item._id), item.title]),
  );
  const courseTitle = new Map(
    courses.map((item) => [String(item._id), item.title]),
  );

  const [submissions, pendingSubmissions, enrollments, certificates] =
    await Promise.all([
      assignmentIds.length
        ? AssignmentSubmission.find({
            assignment: { $in: assignmentIds },
            submittedAt: { $gte: since },
          })
            .sort({ submittedAt: -1 })
            .limit(10)
            .populate("student", "name")
            .select("assignment student submittedAt")
            .lean()
        : [],
      assignmentIds.length
        ? AssignmentSubmission.countDocuments({
            assignment: { $in: assignmentIds },
            status: { $in: ["Submitted", "Late"] },
          })
        : 0,
      courseIds.length
        ? CourseEnrollment.find({
            course: { $in: courseIds },
            status: { $in: COUNTED_ENROLLMENT_STATUSES },
            createdAt: { $gte: since },
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("course studentName studentEmail createdAt")
            .lean()
        : [],
      courseIds.length
        ? Certificate.find({
            courseId: { $in: courseIds },
            issuedAt: { $gte: since },
          })
            .sort({ issuedAt: -1 })
            .limit(10)
            .select("studentName courseTitle issuedAt")
            .lean()
        : [],
    ]);

  const items = [
    ...submissions.map((submission) => ({
      id: `sub-${submission._id}`,
      type: "submission",
      title: "New submission",
      message: `${submission.student?.name || "A student"} submitted ${
        assignmentTitle.get(String(submission.assignment)) || "an assignment"
      }`,
      link: `/dashboard/instructor/submissions/${submission._id}/review`,
      at: submission.submittedAt,
    })),
    ...enrollments.map((enrollment) => ({
      id: `enr-${enrollment._id}`,
      type: "enrollment",
      title: "New student enrolled",
      message: `${
        enrollment.studentName || enrollment.studentEmail || "A student"
      } joined ${courseTitle.get(String(enrollment.course)) || "a course"}`,
      link: "/dashboard/instructor/students",
      at: enrollment.createdAt,
    })),
    ...certificates.map((certificate) => ({
      id: `cert-${certificate._id}`,
      type: "completion",
      title: "Course completed",
      message: `${certificate.studentName || "A student"} completed ${
        certificate.courseTitle || "a course"
      }`,
      link: "/dashboard/instructor/courses",
      at: certificate.issuedAt,
    })),
  ];

  return { items, counts: { pendingSubmissions } };
};

/* --------------------------------- student --------------------------------- */

const studentFeed = async (user, since) => {
  const courseIds = await getEnrolledCourseIds(user);

  const [graded, published, sessions, certificates, openAssignments] =
    await Promise.all([
      AssignmentSubmission.find({
        student: user._id,
        status: { $in: ["Graded", "Returned"] },
        updatedAt: { $gte: since },
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate("assignment", "title points")
        .select("assignment status score gradedAt updatedAt")
        .lean(),
      courseIds.length
        ? Assignment.find({
            course: { $in: courseIds },
            status: "Published",
            publishedAt: { $gte: since },
          })
            .sort({ publishedAt: -1 })
            .limit(10)
            .populate("course", "title")
            .select("title course publishedAt")
            .lean()
        : [],
      courseIds.length
        ? Schedule.find({
            course: { $in: courseIds },
            status: "Scheduled",
            endsAt: { $gte: new Date() },
            createdAt: { $gte: since },
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("course", "title")
            .select("title course createdAt")
            .lean()
        : [],
      Certificate.find({ userId: user._id, issuedAt: { $gte: since } })
        .sort({ issuedAt: -1 })
        .limit(5)
        .select("courseTitle issuedAt")
        .lean(),
      courseIds.length
        ? Assignment.find({ course: { $in: courseIds }, status: "Published" })
            .select("dueDate allowLateSubmission")
            .lean()
        : [],
    ]);

  // Unsubmitted (or returned) assignments that are still open — the sidebar badge
  let pendingAssignments = 0;

  if (openAssignments.length > 0) {
    const submissions = await AssignmentSubmission.find({
      student: user._id,
      assignment: { $in: openAssignments.map((item) => item._id) },
    })
      .select("assignment status")
      .lean();

    const byAssignment = new Map(
      submissions.map((item) => [String(item.assignment), item]),
    );
    const now = Date.now();

    pendingAssignments = openAssignments.filter((assignment) => {
      const submission = byAssignment.get(String(assignment._id));
      if (submission && submission.status !== "Returned") return false;

      const pastDue =
        assignment.dueDate && new Date(assignment.dueDate).getTime() < now;
      return !(pastDue && !assignment.allowLateSubmission);
    }).length;
  }

  const items = [
    ...graded
      .filter((submission) => submission.assignment)
      .map((submission) => {
        const isGraded = submission.status === "Graded";

        return {
          id: `grade-${submission._id}-${submission.status}`,
          type: isGraded ? "grade" : "returned",
          title: isGraded ? "Assignment graded" : "Returned for revision",
          message: isGraded
            ? `${submission.assignment.title}: ${submission.score ?? 0}/${
                submission.assignment.points
              }`
            : `${submission.assignment.title} needs changes before it is graded`,
          link: `/dashboard/student/assignments/${submission.assignment._id}`,
          at: isGraded
            ? submission.gradedAt || submission.updatedAt
            : submission.updatedAt,
        };
      }),
    ...published.map((assignment) => ({
      id: `asg-${assignment._id}`,
      type: "assignment",
      title: "New assignment",
      message: `${assignment.title} in ${assignment.course?.title || "your course"}`,
      link: `/dashboard/student/assignments/${assignment._id}`,
      at: assignment.publishedAt,
    })),
    ...sessions.map((session) => ({
      id: `ses-${session._id}`,
      type: "session",
      title: "New session scheduled",
      message: `${session.title} · ${session.course?.title || "your course"}`,
      link: "/dashboard/student",
      at: session.createdAt,
    })),
    ...certificates.map((certificate) => ({
      id: `cert-${certificate._id}`,
      type: "completion",
      title: "Certificate earned",
      message: `You earned a certificate for ${certificate.courseTitle}`,
      link: "/dashboard/student/certificates",
      at: certificate.issuedAt,
    })),
  ];

  return { items, counts: { pendingAssignments } };
};

/* ---------------------------------- state ---------------------------------- */

const getSeenAt = async (userId) => {
  try {
    const state = await NotificationState.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { seenAt: new Date() } },
      { upsert: true, new: true },
    ).lean();

    return state.seenAt;
  } catch (error) {
    // Two requests created it at the same moment — read the winner
    if (error.code === 11000) {
      const state = await NotificationState.findOne({ user: userId }).lean();
      return state?.seenAt || new Date();
    }
    throw error;
  }
};

// GET /api/notifications/summary
export const getSummary = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - WINDOW_MS);
  const seenAt = await getSeenAt(req.user._id);

  let feed = { items: [], counts: {} };

  if (req.user.role === "instructor") {
    feed = await instructorFeed(req.user, since);
  } else if (req.user.role === "student") {
    feed = await studentFeed(req.user, since);
  }

  const notifications = feed.items
    .filter((item) => item.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, MAX_ITEMS)
    .map((item) => ({
      ...item,
      unread: new Date(item.at) > new Date(seenAt),
    }));

  res.json({
    success: true,
    notifications,
    unread: notifications.filter((item) => item.unread).length,
    counts: feed.counts,
  });
});

// POST /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await NotificationState.findOneAndUpdate(
    { user: req.user._id },
    { $set: { seenAt: new Date() } },
    { upsert: true },
  );

  res.json({ success: true });
});
