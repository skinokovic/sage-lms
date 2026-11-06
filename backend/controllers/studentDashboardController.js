import asyncHandler from "express-async-handler";
import Course from "../models/Course.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Certificate from "../models/Certificate.js";
import Progress from "../models/Progress.js";
import { getEnrolledCourseIds } from "../utils/studentEnrollments.js";
import {
  displayName,
  issueCertificatesForStudent,
} from "../utils/issueCertificates.js";
import { parseMinutes } from "../utils/lessonDuration.js";
import Schedule from "../models/Schedule.js";

// Lessons a student is expected to finish each month (drives the Learning Goal ring)
const MONTHLY_LESSON_TARGET = 12;
const HOUR_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;

// First moment of this month in Nigerian time (UTC+1)
const startOfMonthLagos = () => {
  const lagos = new Date(Date.now() + HOUR_MS);
  return new Date(
    Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), 1) - HOUR_MS,
  );
};

const statusLabel = (progress) => {
  if (progress >= 100) return "Completed";
  if (progress >= 80) return "Almost complete";
  if (progress > 0) return "In progress";
  return "Not started";
};

const emptyResponse = (certificates) => ({
  success: true,
  stats: {
    enrolled: 0,
    completed: 0,
    assignmentsDue: 0,
    assignmentsOverdue: 0,
    certificates,
  },
  continueCourse: null,
  goal: { lessonsThisMonth: 0, target: MONTHLY_LESSON_TARGET, percent: 0 },
  courses: [],
  assignments: [],
  nextClass: null,
});

// GET /api/student/dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  // Make sure certificates for finished courses exist before counting them
  await issueCertificatesForStudent(req.user);

  const [courseIds, certificates] = await Promise.all([
    getEnrolledCourseIds(req.user),
    Certificate.countDocuments({ userId: req.user._id }),
  ]);

  if (courseIds.length === 0) {
    return res.json(emptyResponse(certificates));
  }

  const [courses, doneRows, assignments] = await Promise.all([
    Course.find({ _id: { $in: courseIds } })
      .select(
        "title category duration instructor modules.lessons._id modules.lessons.duration",
      )
      .populate("instructor", "name firstName lastName")
      .lean(),
    Progress.find({
      userId: req.user._id,
      courseId: { $in: courseIds },
      completed: true,
    })
      .select("courseId lessonId completedAt updatedAt")
      .lean(),
    Assignment.find({ course: { $in: courseIds }, status: "Published" })
      .select("title course dueDate allowLateSubmission")
      .populate("course", "title")
      .lean(),
  ]);

  const submissions = assignments.length
    ? await AssignmentSubmission.find({
        student: req.user._id,
        assignment: { $in: assignments.map((item) => item._id) },
      })
        .select("assignment status")
        .lean()
    : [];

  /* ------------------------------- courses ------------------------------- */

  const rowsByCourse = new Map();
  doneRows.forEach((row) => {
    const key = String(row.courseId);
    rowsByCourse.set(key, [...(rowsByCourse.get(key) || []), row]);
  });

  const monthStart = startOfMonthLagos();
  let lessonsThisMonth = 0;

  const summaries = courses.map((course) => {
    const key = String(course._id);
    const lessons = (course.modules || []).flatMap(
      (courseModule) => courseModule.lessons || [],
    );
    const lessonIds = new Set(lessons.map((lesson) => String(lesson._id)));

    // Only count lessons that still exist in the course
    const rows = (rowsByCourse.get(key) || []).filter((row) =>
      lessonIds.has(String(row.lessonId)),
    );
    const doneIds = new Set(rows.map((row) => String(row.lessonId)));

    rows.forEach((row) => {
      if (row.completedAt && row.completedAt >= monthStart) {
        lessonsThisMonth += 1;
      }
    });

    const progress = lessons.length
      ? Math.round((doneIds.size / lessons.length) * 100)
      : 0;

    const unfinished = lessons.filter(
      (lesson) => !doneIds.has(String(lesson._id)),
    );
    const nextIndex = lessons.findIndex(
      (lesson) => !doneIds.has(String(lesson._id)),
    );

    const lastActivity = rows.reduce((latest, row) => {
      const time = new Date(row.completedAt || row.updatedAt).getTime();
      return time > latest ? time : latest;
    }, 0);

    return {
      id: key,
      title: course.title,
      category: course.category || "General",
      instructor: displayName(course.instructor) || "SAGE Instructor",
      lessons: lessons.length,
      duration: course.duration || "Self-paced",
      progress,
      status: statusLabel(progress),
      lastActivity,
      nextLesson: nextIndex + 1,
      remainingLessons: unfinished.length,
      remainingMinutes: unfinished.reduce(
        (total, lesson) => total + parseMinutes(lesson.duration),
        0,
      ),
    };
  });

  const completed = summaries.filter(
    (course) => course.lessons > 0 && course.progress >= 100,
  ).length;

  const rank = (course) =>
    course.progress >= 100 ? 2 : course.progress > 0 ? 0 : 1;

  const sorted = [...summaries].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      b.lastActivity - a.lastActivity ||
      a.title.localeCompare(b.title),
  );

  const resume = sorted.find(
    (course) => course.lessons > 0 && course.progress < 100,
  );

  const continueCourse = resume
    ? {
        id: resume.id,
        title: resume.title,
        progress: resume.progress,
        nextLesson: resume.nextLesson,
        totalLessons: resume.lessons,
        remainingLessons: resume.remainingLessons,
        remainingMinutes: resume.remainingMinutes,
      }
    : null;

  /* ------------------------------ assignments ------------------------------ */

  const submissionByAssignment = new Map(
    submissions.map((item) => [String(item.assignment), item]),
  );
  const now = Date.now();

  // Not submitted yet (or returned for revision) and still open for submission
  const pending = assignments
    .filter((assignment) => {
      const submission = submissionByAssignment.get(String(assignment._id));
      if (submission && submission.status !== "Returned") return false;

      const pastDue =
        assignment.dueDate && new Date(assignment.dueDate).getTime() < now;
      return !(pastDue && !assignment.allowLateSubmission);
    })
    .sort(
      (a, b) => new Date(a.dueDate || 8.64e15) - new Date(b.dueDate || 8.64e15),
    );

  const dueTime = (assignment) =>
    assignment.dueDate ? new Date(assignment.dueDate).getTime() : null;

  const assignmentsOverdue = pending.filter(
    (assignment) => dueTime(assignment) !== null && dueTime(assignment) < now,
  ).length;

  const assignmentsDue = pending.filter(
    (assignment) =>
      dueTime(assignment) !== null &&
      dueTime(assignment) >= now &&
      dueTime(assignment) <= now + WEEK_MS,
  ).length;

  /* ---------------------------------- goal --------------------------------- */

  const percent = Math.min(
    100,
    Math.round((lessonsThisMonth / MONTHLY_LESSON_TARGET) * 100),
  );

  /* ------------------------------ next class ------------------------------ */

  const upcoming = await Schedule.findOne({
    course: { $in: courseIds },
    status: "Scheduled",
    endsAt: { $gte: new Date() },
  })
    .sort({ startsAt: 1 })
    .populate("course", "title")
    .populate("instructor", "name firstName lastName avatarUrl")
    .lean();

  const nextClass = upcoming
    ? {
        id: String(upcoming._id),
        title: upcoming.title,
        course: upcoming.course?.title || "Course",
        type: upcoming.type,
        mode: upcoming.mode,
        location: upcoming.location,
        // Only enrolled students reach this code, so the link is safe to share
        meetingLink: upcoming.mode === "Online" ? upcoming.meetingLink : "",
        startsAt: upcoming.startsAt,
        endsAt: upcoming.endsAt,
        live: new Date(upcoming.startsAt).getTime() <= Date.now(),
        instructor: {
          name: displayName(upcoming.instructor) || "Instructor",
          avatarUrl: upcoming.instructor?.avatarUrl || "",
        },
      }
    : null;

  res.json({
    success: true,
    stats: {
      enrolled: summaries.length,
      completed,
      assignmentsDue,
      assignmentsOverdue,
      certificates,
    },
    continueCourse,
    goal: {
      lessonsThisMonth,
      target: MONTHLY_LESSON_TARGET,
      percent,
    },
    courses: sorted.slice(0, 3).map((course) => ({
      id: course.id,
      title: course.title,
      category: course.category,
      instructor: course.instructor,
      lessons: course.lessons,
      duration: course.duration,
      progress: course.progress,
      status: course.status,
    })),
    assignments: pending.slice(0, 3).map((assignment) => ({
      id: String(assignment._id),
      title: assignment.title,
      course: assignment.course?.title || "Course",
      dueDate: assignment.dueDate || null,
    })),
    // Live classes aren't connected yet
    nextClass,
  });
});

// GET /api/student/pending-assignments  (sidebar badge)
export const getPendingAssignmentCount = asyncHandler(async (req, res) => {
  const courseIds = await getEnrolledCourseIds(req.user);

  if (courseIds.length === 0) {
    return res.json({ success: true, count: 0 });
  }

  const assignments = await Assignment.find({
    course: { $in: courseIds },
    status: "Published",
  })
    .select("dueDate allowLateSubmission")
    .lean();

  if (assignments.length === 0) {
    return res.json({ success: true, count: 0 });
  }

  const submissions = await AssignmentSubmission.find({
    student: req.user._id,
    assignment: { $in: assignments.map((item) => item._id) },
  })
    .select("assignment status")
    .lean();

  const submissionByAssignment = new Map(
    submissions.map((item) => [String(item.assignment), item]),
  );
  const now = Date.now();

  const count = assignments.filter((assignment) => {
    const submission = submissionByAssignment.get(String(assignment._id));
    if (submission && submission.status !== "Returned") return false;

    const pastDue =
      assignment.dueDate && new Date(assignment.dueDate).getTime() < now;
    return !(pastDue && !assignment.allowLateSubmission);
  }).length;

  res.json({ success: true, count });
});
