import asyncHandler from "express-async-handler";

import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/CourseEnrollment.js";
import Progress from "../models/Progress.js";
import Payment from "../models/PaymentOrder.js";
import Certificate from "../models/Certificate.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";

/* =========================================================
   HELPERS
========================================================= */

const getStartDate = (range) => {
  const now = new Date();

  switch (range) {
    case "7d": {
      const date = new Date(now);
      date.setDate(date.getDate() - 6);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    case "30d": {
      const date = new Date(now);
      date.setDate(date.getDate() - 29);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    case "90d": {
      const date = new Date(now);
      date.setDate(date.getDate() - 89);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    case "1y": {
      const date = new Date(now);
      date.setFullYear(date.getFullYear() - 1);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    default: {
      const date = new Date(now);
      date.setDate(date.getDate() - 29);
      date.setHours(0, 0, 0, 0);
      return date;
    }
  }
};

const getPreviousStartDate = (range) => {
  const startDate = getStartDate(range);
  const now = new Date();

  const duration = now.getTime() - startDate.getTime();

  return new Date(startDate.getTime() - duration);
};

const getPeriodLabel = (date, range) => {
  if (range === "7d" || range === "30d") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const round = (value, decimals = 1) => {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
};

/* =========================================================
   GET ADMIN ANALYTICS
========================================================= */

export const getAnalytics = asyncHandler(async (req, res) => {
  const range = req.query.range || "30d";

  const startDate = getStartDate(range);
  const previousStartDate = getPreviousStartDate(range);
  const now = new Date();

  /* =======================================================
     BASIC PLATFORM COUNTS
  ======================================================= */

  const [
    totalStudents,
    activeStudents,
    totalCourses,
    publishedCourses,
    totalInstructors,
    totalEnrollments,
    completedEnrollments,
    certificatesIssued,
  ] = await Promise.all([
    User.countDocuments({
      role: "student",
    }),

    User.countDocuments({
      role: "student",
      isActive: true,
    }),

    Course.countDocuments(),

    Course.countDocuments({
      status: "Published",
    }),

    User.countDocuments({
      role: "instructor",
    }),

    Enrollment.countDocuments(),

    Enrollment.countDocuments({
      status: "completed",
    }),

    Certificate.countDocuments(),
  ]);

  /* =======================================================
     PREVIOUS PERIOD COUNTS
  ======================================================= */

  const [previousEnrollments, previousActiveStudents] = await Promise.all([
    Enrollment.countDocuments({
      enrolledAt: {
        $gte: previousStartDate,
        $lt: startDate,
      },
    }),

    User.countDocuments({
      role: "student",
      isActive: true,
      createdAt: {
        $lt: startDate,
      },
    }),
  ]);

  /* =======================================================
     ENROLLMENT COMPLETION
  ======================================================= */

  const completionRate =
    totalEnrollments > 0
      ? round((completedEnrollments / totalEnrollments) * 100, 1)
      : 0;

  /* =======================================================
     ENROLLMENT TREND
  ======================================================= */

  const enrollmentTrend = await Enrollment.aggregate([
    {
      $match: {
        enrolledAt: {
          $gte: startDate,
          $lte: now,
        },
      },
    },

    {
      $group: {
        _id: {
          $dateToString: {
            format: range === "1y" ? "%Y-%m" : "%Y-%m-%d",
            date: "$enrolledAt",
          },
        },

        value: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const currentEnrollmentData = enrollmentTrend.map((item) => {
    const date = new Date(item._id);

    return {
      label: getPeriodLabel(date, range),
      value: item.value,
    };
  });

  /* =======================================================
     REVENUE
  ======================================================= */

  const revenueResult = await Payment.aggregate([
    {
      $match: {
        status: "succeeded",
      },
    },

    {
      $group: {
        _id: null,

        total: {
          $sum: "$amount",
        },
      },
    },
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  /* =======================================================
     REVENUE TREND
  ======================================================= */

  const revenueTrend = await Payment.aggregate([
    {
      $match: {
        status: "succeeded",

        createdAt: {
          $gte: startDate,
          $lte: now,
        },
      },
    },

    {
      $group: {
        _id: {
          $dateToString: {
            format: range === "1y" ? "%Y-%m" : "%Y-%m-%d",
            date: "$createdAt",
          },
        },

        value: {
          $sum: "$amount",
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const revenueData = revenueTrend.map((item) => {
    const date = new Date(item._id);

    return {
      label: getPeriodLabel(date, range),
      value: item.value,
    };
  });

  /* =======================================================
     COURSE PERFORMANCE
  ======================================================= */

  const coursePerformanceRaw = await Enrollment.aggregate([
    {
      $group: {
        _id: "$courseId",

        students: {
          $sum: 1,
        },

        completed: {
          $sum: {
            $cond: [
              {
                $eq: ["$status", "completed"],
              },
              1,
              0,
            ],
          },
        },
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

    {
      $unwind: {
        path: "$course",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        name: {
          $ifNull: ["$course.title", "Unknown Course"],
        },

        students: 1,

        completion: {
          $cond: [
            {
              $gt: ["$students", 0],
            },
            {
              $multiply: [
                {
                  $divide: ["$completed", "$students"],
                },
                100,
              ],
            },
            0,
          ],
        },

        rating: {
          $ifNull: ["$course.rating", 0],
        },
      },
    },

    {
      $sort: {
        students: -1,
      },
    },

    {
      $limit: 10,
    },
  ]);

  /* =======================================================
     ASSIGNMENT PERFORMANCE
  ======================================================= */

  const assignmentScoreResult = await AssignmentSubmission.aggregate([
    {
      $match: {
        score: {
          $ne: null,
        },
      },
    },

    {
      $lookup: {
        from: "assignments",
        localField: "assignment",
        foreignField: "_id",
        as: "assignment",
      },
    },

    {
      $unwind: "$assignment",
    },

    {
      $project: {
        percentage: {
          $cond: [
            {
              $gt: ["$assignment.points", 0],
            },
            {
              $multiply: [
                {
                  $divide: ["$score", "$assignment.points"],
                },
                100,
              ],
            },
            0,
          ],
        },
      },
    },

    {
      $group: {
        _id: null,

        averageScore: {
          $avg: "$percentage",
        },
      },
    },
  ]);

  const averageScore =
    assignmentScoreResult.length > 0
      ? round(assignmentScoreResult[0].averageScore, 1)
      : 0;

  /* =======================================================
     COURSE ASSIGNMENT SCORES
  ======================================================= */

  const courseAssignmentScores = await AssignmentSubmission.aggregate([
    {
      $match: {
        score: {
          $ne: null,
        },
      },
    },

    {
      $lookup: {
        from: "assignments",
        localField: "assignment",
        foreignField: "_id",
        as: "assignment",
      },
    },

    {
      $unwind: "$assignment",
    },

    {
      $lookup: {
        from: "courses",
        localField: "assignment.course",
        foreignField: "_id",
        as: "course",
      },
    },

    {
      $unwind: {
        path: "$course",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        courseId: "$assignment.course",

        courseName: {
          $ifNull: ["$course.title", "Unknown Course"],
        },

        percentage: {
          $cond: [
            {
              $gt: ["$assignment.points", 0],
            },
            {
              $multiply: [
                {
                  $divide: ["$score", "$assignment.points"],
                },
                100,
              ],
            },
            0,
          ],
        },
      },
    },

    {
      $group: {
        _id: "$courseId",

        courseName: {
          $first: "$courseName",
        },

        averageScore: {
          $avg: "$percentage",
        },
      },
    },
  ]);

  const scoreMap = new Map(
    courseAssignmentScores.map((item) => [
      String(item._id),
      round(item.averageScore, 1),
    ]),
  );

  const coursePerformance = coursePerformanceRaw.map((course) => ({
    name: course.name,

    students: course.students,

    completion: round(course.completion, 1),

    averageScore: scoreMap.get(String(course._id)) || 0,

    engagement: round(course.completion, 1),
  }));

  /* =======================================================
     PROGRESS / STUDENT ACTIVITY
  ======================================================= */

  const completedLessons = await Progress.countDocuments({
    completed: true,
    completedAt: {
      $gte: startDate,
      $lte: now,
    },
  });

  const totalProgressRecords = await Progress.countDocuments({
    updatedAt: {
      $gte: startDate,
      $lte: now,
    },
  });

  const assignmentSubmissions = await AssignmentSubmission.countDocuments({
    submittedAt: {
      $gte: startDate,
      $lte: now,
    },
  });

  const certificateCompletions = await Certificate.countDocuments({
    issuedAt: {
      $gte: startDate,
      $lte: now,
    },
  });

  const activeStudentPercentage =
    totalStudents > 0 ? round((activeStudents / totalStudents) * 100, 1) : 0;

  const activityData = [
    {
      label: "Active Students",
      value: activeStudents,
      percentage: activeStudentPercentage,
    },

    {
      label: "Course Completion",
      value: completionRate,
      percentage: completionRate,
    },

    {
      label: "Assignment Submission",
      value: assignmentSubmissions,
      percentage: assignmentSubmissions > 0 ? 100 : 0,
    },

    {
      label: "Certificate Completion",
      value: certificateCompletions,
      percentage: certificateCompletions > 0 ? 100 : 0,
    },
  ];

  /* =======================================================
     CHANGE CALCULATIONS
  ======================================================= */

  const enrollmentChange =
    previousEnrollments > 0
      ? round(
          ((currentEnrollmentData.reduce(
            (total, item) => total + item.value,
            0,
          ) -
            previousEnrollments) /
            previousEnrollments) *
            100,
          1,
        )
      : 0;

  const activeStudentChange =
    previousActiveStudents > 0
      ? round(
          ((activeStudents - previousActiveStudents) / previousActiveStudents) *
            100,
          1,
        )
      : 0;

  /* =======================================================
     RESPONSE
  ======================================================= */

  res.status(200).json({
    success: true,

    data: {
      dateRange: range,

      summary: {
        totalStudents,
        activeStudents,
        totalCourses,
        publishedCourses,
        totalInstructors,
        totalEnrollments,
        completedEnrollments,
        completionRate,
        averageScore,
        totalRevenue,
        certificatesIssued,
      },

      changes: {
        enrollments: enrollmentChange,
        activeStudents: activeStudentChange,
      },

      enrollmentData: currentEnrollmentData,

      activityData,

      coursePerformance,

      revenueData,

      totals: {
        totalRevenue,

        totalCourseStudents: coursePerformance.reduce(
          (total, course) => total + course.students,
          0,
        ),

        completedLessons,

        totalProgressRecords,

        assignmentSubmissions,

        certificateCompletions,
      },
    },
  });
});
