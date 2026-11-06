// import asyncHandler from "express-async-handler";

// import User from "../models/User.js";
// import Course from "../models/Course.js";
// import Enrollment from "../models/CourseEnrollment.js";
// import Certificate from "../models/Certificate.js";
// import Assignment from "../models/Assignment.js";
// import AssignmentSubmission from "../models/AssignmentSubmission.js";

// // CourseEnrollment links a student with `user` and a course with `course`.
// // Revoked enrollments are not counted as students on the platform.
// const COUNTED_STATUSES = ["active", "completed"];
// const countedFilter = { status: { $in: COUNTED_STATUSES } };

// const getMonthStart = (date) =>
//   new Date(date.getFullYear(), date.getMonth(), 1);

// const getRelativeTime = (value) => {
//   const date = new Date(value);
//   const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

//   if (seconds < 60) return "Just now";
//   const minutes = Math.floor(seconds / 60);
//   if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
//   const hours = Math.floor(minutes / 60);
//   if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
//   const days = Math.floor(hours / 24);
//   if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
//   return date.toLocaleDateString("en-NG", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// };

// const safePercent = (numerator, denominator) =>
//   denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

// export const getAdminDashboard = asyncHandler(async (req, res) => {
//   const monthsRequested = Number.parseInt(req.query.months, 10);
//   const months = monthsRequested === 12 ? 12 : 6;
//   const now = new Date();
//   const todayStart = new Date(now);
//   todayStart.setHours(0, 0, 0, 0);
//   const currentMonthStart = getMonthStart(now);
//   const previousMonthStart = new Date(currentMonthStart);
//   previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
//   const chartStart = new Date(
//     now.getFullYear(),
//     now.getMonth() - (months - 1),
//     1,
//   );

//   const [
//     totalStudents,
//     totalInstructors,
//     activeCourses,
//     totalEnrollments,
//     completedEnrollments,
//     certificatesIssued,
//     totalAssignments,
//     pendingSubmissions,
//     activeToday,
//     currentMonthEnrollments,
//     previousMonthEnrollments,
//     chartEnrollments,
//     recentStudents,
//     recentCourses,
//     recentSubmissions,
//     recentEnrollments,
//   ] = await Promise.all([
//     User.countDocuments({ role: "student" }),
//     User.countDocuments({ role: "instructor", isActive: true }),
//     Course.countDocuments({ status: "Published" }),
//     Enrollment.countDocuments(countedFilter),
//     Enrollment.countDocuments({ status: "completed" }),
//     Certificate.countDocuments(),
//     Assignment.countDocuments(),
//     AssignmentSubmission.countDocuments({
//       status: { $in: ["Submitted", "Late"] },
//     }),
//     User.countDocuments({ role: "student", lastLoginAt: { $gte: todayStart } }),
//     Enrollment.countDocuments({
//       ...countedFilter,
//       enrolledAt: { $gte: currentMonthStart, $lte: now },
//     }),
//     Enrollment.countDocuments({
//       ...countedFilter,
//       enrolledAt: { $gte: previousMonthStart, $lt: currentMonthStart },
//     }),
//     Enrollment.aggregate([
//       {
//         $match: {
//           ...countedFilter,
//           enrolledAt: { $gte: chartStart, $lte: now },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             year: { $year: "$enrolledAt" },
//             month: { $month: "$enrolledAt" },
//           },
//           enrollments: { $sum: 1 },
//         },
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } },
//     ]),
//     User.find({ role: "student" })
//       .sort({ createdAt: -1 })
//       .limit(4)
//       .select("name createdAt")
//       .lean(),
//     Course.find()
//       .sort({ createdAt: -1 })
//       .limit(4)
//       .select("title status createdAt")
//       .lean(),
//     AssignmentSubmission.find()
//       .sort({ submittedAt: -1 })
//       .limit(4)
//       .populate("student", "name")
//       .populate("assignment", "title")
//       .select("student assignment submittedAt status")
//       .lean(),
//     Enrollment.find(countedFilter)
//       .sort({ enrolledAt: -1 })
//       .limit(4)
//       .populate("user", "name")
//       .populate("course", "title")
//       .select("user course studentName enrolledAt status")
//       .lean(),
//   ]);

//   const enrollmentLookup = new Map(
//     chartEnrollments.map((item) => [
//       `${item._id.year}-${item._id.month}`,
//       item.enrollments,
//     ]),
//   );

//   const enrollmentData = Array.from({ length: months }, (_, index) => {
//     const date = new Date(
//       chartStart.getFullYear(),
//       chartStart.getMonth() + index,
//       1,
//     );
//     const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
//     return {
//       month: date.toLocaleDateString("en-NG", { month: "short" }),
//       year: date.getFullYear(),
//       value: enrollmentLookup.get(key) || 0,
//     };
//   });

//   const popularEnrollmentRows = await Enrollment.aggregate([
//     { $match: countedFilter },
//     {
//       $group: {
//         _id: "$course",
//         students: { $sum: 1 },
//         completed: {
//           $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
//         },
//       },
//     },
//     { $sort: { students: -1 } },
//     { $limit: 5 },
//   ]);

//   const popularIds = popularEnrollmentRows
//     .map((item) => item._id)
//     .filter(Boolean);
//   const popularCourseDocs = await Course.find({ _id: { $in: popularIds } })
//     .populate("instructor", "name")
//     .select("title instructor status")
//     .lean();
//   const courseById = new Map(
//     popularCourseDocs.map((course) => [String(course._id), course]),
//   );

//   const popularCourses = popularEnrollmentRows.map((row) => {
//     const course = courseById.get(String(row._id));
//     return {
//       id: String(row._id),
//       name: course?.title || "Course unavailable",
//       instructor: course?.instructor?.name || "Not assigned",
//       students: row.students || 0,
//       completion: safePercent(row.completed || 0, row.students || 0),
//     };
//   });

//   const activityItems = [
//     ...recentStudents.map((student) => ({
//       type: "enrollment",
//       title: "New student registered",
//       description: student.name || "A student joined the platform",
//       createdAt: student.createdAt,
//     })),
//     ...recentCourses.map((course) => ({
//       type: "course",
//       title:
//         course.status === "Published" ? "Course published" : "Course created",
//       description: course.title,
//       createdAt: course.createdAt,
//     })),
//     ...recentSubmissions.map((submission) => ({
//       type: "assignment",
//       title: "Assignment submitted",
//       description: `${submission.student?.name || "A student"} — ${submission.assignment?.title || "Assignment"}`,
//       createdAt: submission.submittedAt,
//     })),
//     ...recentEnrollments.map((enrollment) => ({
//       type: enrollment.status === "completed" ? "completion" : "enrollment",
//       title:
//         enrollment.status === "completed"
//           ? "Course completed"
//           : "Student enrolled",
//       // Older payment enrollments have no linked account, only a saved name.
//       description: `${enrollment.user?.name || enrollment.studentName || "A student"} — ${enrollment.course?.title || "Course"}`,
//       createdAt: enrollment.enrolledAt,
//     })),
//   ]
//     .filter((item) => item.createdAt)
//     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//     .slice(0, 6)
//     .map(({ createdAt, ...item }) => ({
//       ...item,
//       time: getRelativeTime(createdAt),
//     }));

//   const monthChange =
//     previousMonthEnrollments > 0
//       ? Math.round(
//           ((currentMonthEnrollments - previousMonthEnrollments) /
//             previousMonthEnrollments) *
//             1000,
//         ) / 10
//       : currentMonthEnrollments > 0
//         ? 100
//         : 0;

//   res.status(200).json({
//     success: true,
//     data: {
//       stats: {
//         totalStudents,
//         totalInstructors,
//         activeCourses,
//         completionRate: safePercent(completedEnrollments, totalEnrollments),
//         totalEnrollments,
//         certificatesIssued,
//         totalAssignments,
//         pendingSubmissions,
//         activeToday,
//       },
//       enrollmentData,
//       currentMonthEnrollments,
//       previousMonthEnrollments,
//       enrollmentGrowth: monthChange,
//       popularCourses,
//       recentActivity: activityItems,
//       platform: { status: "Dashboard API responding" },
//     },
//   });
// });

import asyncHandler from "express-async-handler";

import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/CourseEnrollment.js";
import Certificate from "../models/Certificate.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import BankTransferRequest from "../models/bankTransferRequest.js";

// CourseEnrollment links a student with `user` and a course with `course`.
// Revoked enrollments are not counted as students on the platform.
const COUNTED_STATUSES = ["active", "completed"];
const countedFilter = { status: { $in: COUNTED_STATUSES } };

const getMonthStart = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const getRelativeTime = (value) => {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const safePercent = (numerator, denominator) =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const monthsRequested = Number.parseInt(req.query.months, 10);
  const months = monthsRequested === 12 ? 12 : 6;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const currentMonthStart = getMonthStart(now);
  const previousMonthStart = new Date(currentMonthStart);
  previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
  const chartStart = new Date(
    now.getFullYear(),
    now.getMonth() - (months - 1),
    1,
  );

  const [
    totalStudents,
    totalInstructors,
    activeCourses,
    totalEnrollments,
    completedEnrollments,
    certificatesIssued,
    totalAssignments,
    pendingSubmissions,
    activeToday,
    currentMonthEnrollments,
    previousMonthEnrollments,
    chartEnrollments,
    recentStudents,
    recentCourses,
    recentSubmissions,
    recentEnrollments,
    pendingBankTransfers,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "instructor", isActive: true }),
    Course.countDocuments({ status: "Published" }),
    Enrollment.countDocuments(countedFilter),
    Enrollment.countDocuments({ status: "completed" }),
    Certificate.countDocuments(),
    Assignment.countDocuments(),
    AssignmentSubmission.countDocuments({
      status: { $in: ["Submitted", "Late"] },
    }),
    User.countDocuments({ role: "student", lastLoginAt: { $gte: todayStart } }),
    Enrollment.countDocuments({
      ...countedFilter,
      enrolledAt: { $gte: currentMonthStart, $lte: now },
    }),
    Enrollment.countDocuments({
      ...countedFilter,
      enrolledAt: { $gte: previousMonthStart, $lt: currentMonthStart },
    }),
    Enrollment.aggregate([
      {
        $match: {
          ...countedFilter,
          enrolledAt: { $gte: chartStart, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$enrolledAt" },
            month: { $month: "$enrolledAt" },
          },
          enrollments: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    User.find({ role: "student" })
      .sort({ createdAt: -1 })
      .limit(4)
      .select("name createdAt")
      .lean(),
    Course.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .select("title status createdAt")
      .lean(),
    AssignmentSubmission.find()
      .sort({ submittedAt: -1 })
      .limit(4)
      .populate("student", "name")
      .populate("assignment", "title")
      .select("student assignment submittedAt status")
      .lean(),
    Enrollment.find(countedFilter)
      .sort({ enrolledAt: -1 })
      .limit(4)
      .populate("user", "name")
      .populate("course", "title")
      .select("user course studentName enrolledAt status")
      .lean(),
    BankTransferRequest.countDocuments({ status: "pending" }),
  ]);

  const enrollmentLookup = new Map(
    chartEnrollments.map((item) => [
      `${item._id.year}-${item._id.month}`,
      item.enrollments,
    ]),
  );

  const enrollmentData = Array.from({ length: months }, (_, index) => {
    const date = new Date(
      chartStart.getFullYear(),
      chartStart.getMonth() + index,
      1,
    );
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    return {
      month: date.toLocaleDateString("en-NG", { month: "short" }),
      year: date.getFullYear(),
      value: enrollmentLookup.get(key) || 0,
    };
  });

  const popularEnrollmentRows = await Enrollment.aggregate([
    { $match: countedFilter },
    {
      $group: {
        _id: "$course",
        students: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
    { $sort: { students: -1 } },
    { $limit: 5 },
  ]);

  const popularIds = popularEnrollmentRows
    .map((item) => item._id)
    .filter(Boolean);
  const popularCourseDocs = await Course.find({ _id: { $in: popularIds } })
    .populate("instructor", "name")
    .select("title instructor status")
    .lean();
  const courseById = new Map(
    popularCourseDocs.map((course) => [String(course._id), course]),
  );

  const popularCourses = popularEnrollmentRows.map((row) => {
    const course = courseById.get(String(row._id));
    return {
      id: String(row._id),
      name: course?.title || "Course unavailable",
      instructor: course?.instructor?.name || "Not assigned",
      students: row.students || 0,
      completion: safePercent(row.completed || 0, row.students || 0),
    };
  });

  const activityItems = [
    ...recentStudents.map((student) => ({
      type: "enrollment",
      title: "New student registered",
      description: student.name || "A student joined the platform",
      createdAt: student.createdAt,
    })),
    ...recentCourses.map((course) => ({
      type: "course",
      title:
        course.status === "Published" ? "Course published" : "Course created",
      description: course.title,
      createdAt: course.createdAt,
    })),
    ...recentSubmissions.map((submission) => ({
      type: "assignment",
      title: "Assignment submitted",
      description: `${submission.student?.name || "A student"} — ${submission.assignment?.title || "Assignment"}`,
      createdAt: submission.submittedAt,
    })),
    ...recentEnrollments.map((enrollment) => ({
      type: enrollment.status === "completed" ? "completion" : "enrollment",
      title:
        enrollment.status === "completed"
          ? "Course completed"
          : "Student enrolled",
      // Older payment enrollments have no linked account, only a saved name.
      description: `${enrollment.user?.name || enrollment.studentName || "A student"} — ${enrollment.course?.title || "Course"}`,
      createdAt: enrollment.enrolledAt,
    })),
  ]
    .filter((item) => item.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)
    .map(({ createdAt, ...item }) => ({
      ...item,
      time: getRelativeTime(createdAt),
    }));

  const monthChange =
    previousMonthEnrollments > 0
      ? Math.round(
          ((currentMonthEnrollments - previousMonthEnrollments) /
            previousMonthEnrollments) *
            1000,
        ) / 10
      : currentMonthEnrollments > 0
        ? 100
        : 0;

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalStudents,
        totalInstructors,
        activeCourses,
        completionRate: safePercent(completedEnrollments, totalEnrollments),
        totalEnrollments,
        certificatesIssued,
        totalAssignments,
        pendingSubmissions,
        activeToday,
        pendingBankTransfers,
      },
      enrollmentData,
      currentMonthEnrollments,
      previousMonthEnrollments,
      enrollmentGrowth: monthChange,
      popularCourses,
      recentActivity: activityItems,
      platform: { status: "Dashboard API responding" },
    },
  });
});
