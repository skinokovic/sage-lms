import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Progress from "../models/Progress.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";

// Enrollments with these statuses count as students on a course.
const COUNTED_STATUSES = ["active", "completed"];

// A student with no activity for this long is shown as Inactive.
const INACTIVE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

const average = (numbers) =>
  numbers.length
    ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
    : null;

const latestDate = (...dates) => {
  const valid = dates.filter(Boolean).map((value) => new Date(value));
  return valid.length
    ? new Date(Math.max(...valid.map((date) => date.getTime())))
    : null;
};

/* ------------------------------------------------------------------ */
/* Data loading                                                        */
/* ------------------------------------------------------------------ */

// The instructor's own courses, with the lesson ids needed to work out
// progress. Only ids are loaded, not lesson content.
const loadInstructorCourses = async (instructorId) => {
  const courses = await Course.find({ instructor: instructorId })
    .select("title modules._id modules.lessons._id")
    .lean();

  const courseMap = new Map();

  courses.forEach((course) => {
    const lessonIds = new Set(
      (course.modules || []).flatMap((courseModule) =>
        (courseModule.lessons || []).map((lesson) => String(lesson._id)),
      ),
    );

    courseMap.set(String(course._id), {
      id: String(course._id),
      objectId: course._id,
      title: course.title,
      lessonIds,
      lessonCount: lessonIds.size,
    });
  });

  return courseMap;
};

// Builds one row per student enrolled in any of `courseIds`.
// Each row also carries `courseDetails` (a per-course breakdown).
const loadStudentRows = async (courseMap, courseIds) => {
  const courseObjectIds = courseIds.map((id) => courseMap.get(id).objectId);

  const enrollments = await CourseEnrollment.find({
    course: { $in: courseObjectIds },
    status: { $in: COUNTED_STATUSES },
  })
    .select(
      "user course studentEmail studentName studentPhone status enrolledAt",
    )
    .lean();

  if (enrollments.length === 0) return [];

  // Match each enrollment to a user account: by id, or by email for
  // enrollments created before accounts were linked.
  const userIds = [
    ...new Set(
      enrollments.filter((item) => item.user).map((item) => String(item.user)),
    ),
  ];
  const emails = [
    ...new Set(
      enrollments
        .filter((item) => !item.user)
        .map((item) => String(item.studentEmail || "").toLowerCase())
        .filter(Boolean),
    ),
  ];

  const users = await User.find({
    $or: [
      { _id: { $in: userIds } },
      ...(emails.length ? [{ email: { $in: emails } }] : []),
    ],
  })
    .select("name email phone phoneNumber isActive lastLoginAt createdAt")
    .lean();

  const userById = new Map(users.map((user) => [String(user._id), user]));
  const userByEmail = new Map(
    users.map((user) => [String(user.email || "").toLowerCase(), user]),
  );

  // Group enrollments by student.
  const groups = new Map();

  enrollments.forEach((enrollment) => {
    const email = String(enrollment.studentEmail || "").toLowerCase();
    const user =
      (enrollment.user && userById.get(String(enrollment.user))) ||
      userByEmail.get(email) ||
      null;

    const key = user ? String(user._id) : `email:${email}`;

    if (!groups.has(key)) {
      groups.set(key, { key, user, email, enrollments: new Map() });
    }

    // One enrollment per course per student.
    groups.get(key).enrollments.set(String(enrollment.course), {
      ...enrollment,
      studentName: enrollment.studentName,
      studentPhone: enrollment.studentPhone,
    });
  });

  const accountIds = [...groups.values()]
    .filter((group) => group.user)
    .map((group) => group.user._id);

  const [progressRows, assignments] = await Promise.all([
    accountIds.length
      ? Progress.find({
          userId: { $in: accountIds },
          courseId: { $in: courseObjectIds },
          completed: true,
        })
          .select("userId courseId lessonId updatedAt")
          .lean()
      : [],
    Assignment.find({
      course: { $in: courseObjectIds },
      status: { $in: ["Published", "Closed"] },
    })
      .select("course points")
      .lean(),
  ]);

  const assignmentIds = assignments.map((assignment) => assignment._id);

  const submissions =
    accountIds.length && assignmentIds.length
      ? await AssignmentSubmission.find({
          assignment: { $in: assignmentIds },
          student: { $in: accountIds },
        })
          .select("assignment student score submittedAt")
          .lean()
      : [];

  // Lookups
  const assignmentById = new Map(
    assignments.map((assignment) => [String(assignment._id), assignment]),
  );

  const assignmentsByCourse = new Map();
  assignments.forEach((assignment) => {
    const key = String(assignment.course);
    if (!assignmentsByCourse.has(key)) assignmentsByCourse.set(key, []);
    assignmentsByCourse.get(key).push(assignment);
  });

  // Completed lesson ids per student and course (only lessons that still exist).
  const doneByUserCourse = new Map();
  const lastProgressByUser = new Map();

  progressRows.forEach((row) => {
    const course = courseMap.get(String(row.courseId));
    if (!course || !course.lessonIds.has(String(row.lessonId))) return;

    const key = `${row.userId}:${row.courseId}`;
    if (!doneByUserCourse.has(key)) doneByUserCourse.set(key, new Set());
    doneByUserCourse.get(key).add(String(row.lessonId));

    const userKey = String(row.userId);
    lastProgressByUser.set(
      userKey,
      latestDate(lastProgressByUser.get(userKey), row.updatedAt),
    );
  });

  const submissionsByUser = new Map();
  submissions.forEach((submission) => {
    const key = String(submission.student);
    if (!submissionsByUser.has(key)) submissionsByUser.set(key, []);
    submissionsByUser.get(key).push(submission);
  });

  // Build the rows
  const now = Date.now();

  return [...groups.values()].map((group) => {
    const { user } = group;
    const userKey = user ? String(user._id) : null;
    const mySubmissions = userKey ? submissionsByUser.get(userKey) || [] : [];

    const courseDetails = [...group.enrollments.entries()]
      .map(([courseKey, enrollment]) => {
        const course = courseMap.get(courseKey);
        if (!course) return null;

        const completedLessons = userKey
          ? doneByUserCourse.get(`${userKey}:${courseKey}`)?.size || 0
          : 0;

        const courseAssignments = assignmentsByCourse.get(courseKey) || [];
        const courseAssignmentIds = new Set(
          courseAssignments.map((assignment) => String(assignment._id)),
        );

        const courseSubmissions = mySubmissions.filter((submission) =>
          courseAssignmentIds.has(String(submission.assignment)),
        );

        const scores = courseSubmissions
          .map((submission) => {
            const assignment = assignmentById.get(
              String(submission.assignment),
            );
            return typeof submission.score === "number" &&
              assignment?.points > 0
              ? (submission.score / assignment.points) * 100
              : null;
          })
          .filter((value) => value !== null);

        return {
          courseId: course.id,
          title: course.title,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          totalLessons: course.lessonCount,
          completedLessons,
          progress:
            course.lessonCount > 0
              ? Math.min(
                  100,
                  Math.round((completedLessons / course.lessonCount) * 100),
                )
              : 0,
          assignments: courseAssignments.length,
          submitted: courseSubmissions.length,
          scores,
        };
      })
      .filter(Boolean);

    const allScores = courseDetails.flatMap((detail) => detail.scores);
    const averageScore = average(allScores);

    const firstEnrollment = courseDetails
      .map((detail) => detail.enrolledAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a) - new Date(b))[0];

    const firstRecord = [...group.enrollments.values()][0];

    const lastActive = latestDate(
      user?.lastLoginAt,
      userKey ? lastProgressByUser.get(userKey) : null,
      ...mySubmissions.map((submission) => submission.submittedAt),
    );

    let status;
    if (user && user.isActive === false) status = "Inactive";
    else if (!lastActive) status = "Pending";
    else
      status =
        now - lastActive.getTime() > INACTIVE_AFTER_MS ? "Inactive" : "Active";

    return {
      id: group.key,
      hasAccount: Boolean(user),
      name: user?.name || firstRecord?.studentName || group.email || "Student",
      email: user?.email || group.email,
      phone:
        user?.phone || user?.phoneNumber || firstRecord?.studentPhone || "",
      courses: courseDetails.length,
      completed: courseDetails.filter((detail) => detail.status === "completed")
        .length,
      progress: courseDetails.length
        ? Math.round(average(courseDetails.map((detail) => detail.progress)))
        : 0,
      assignments: courseDetails.reduce(
        (sum, detail) => sum + detail.assignments,
        0,
      ),
      submitted: courseDetails.reduce(
        (sum, detail) => sum + detail.submitted,
        0,
      ),
      averageScore: averageScore === null ? null : Math.round(averageScore),
      status,
      joined: user?.createdAt || firstEnrollment || null,
      enrolledAt: firstEnrollment || null,
      lastActive,
      courseDetails: courseDetails.map(({ scores, ...detail }) => ({
        ...detail,
        averageScore: scores.length ? Math.round(average(scores)) : null,
      })),
    };
  });
};

/* ------------------------------------------------------------------ */
/* GET /api/instructor/students                                        */
/* ------------------------------------------------------------------ */

// @desc    Students enrolled in the logged-in instructor's courses
// @query   page, limit, search, status, course, courseCount, progress
// @access  Private (instructor)
export const getInstructorStudents = asyncHandler(async (req, res) => {
  const courseMap = await loadInstructorCourses(req.user._id);
  const allCourseIds = [...courseMap.keys()];

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const courseOptions = [...courseMap.values()]
    .map((course) => ({ id: course.id, title: course.title }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const emptyStats = {
    totalStudents: 0,
    activeStudents: 0,
    pendingStudents: 0,
    inactiveStudents: 0,
    averageProgress: 0,
    averageScore: null,
  };

  if (allCourseIds.length === 0) {
    return res.json({
      success: true,
      students: [],
      pagination: { page, limit, total: 0, totalPages: 1 },
      stats: emptyStats,
      courses: courseOptions,
    });
  }

  // Everything across all of the instructor's courses (used for the stat cards)
  const allRows = await loadStudentRows(courseMap, allCourseIds);

  const scores = allRows
    .map((row) => row.averageScore)
    .filter((value) => value !== null);

  const stats = {
    totalStudents: allRows.length,
    activeStudents: allRows.filter((row) => row.status === "Active").length,
    pendingStudents: allRows.filter((row) => row.status === "Pending").length,
    inactiveStudents: allRows.filter((row) => row.status === "Inactive").length,
    averageProgress: allRows.length
      ? Math.round(average(allRows.map((row) => row.progress)))
      : 0,
    averageScore: scores.length ? Math.round(average(scores)) : null,
  };

  // When a single course is chosen, its numbers are worked out for that course only.
  const { status, course, courseCount, progress } = req.query;
  const search = String(req.query.search || "")
    .trim()
    .toLowerCase();

  let rows = allRows;
  if (course && course !== "All" && courseMap.has(String(course))) {
    rows = await loadStudentRows(courseMap, [String(course)]);
  }

  rows = rows.filter((row) => {
    if (
      search &&
      !row.name.toLowerCase().includes(search) &&
      !String(row.email || "")
        .toLowerCase()
        .includes(search) &&
      !String(row.phone || "")
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }

    if (status && status !== "All" && row.status !== status) return false;

    if (courseCount === "1" && row.courses !== 1) return false;
    if (courseCount === "2" && row.courses !== 2) return false;
    if (courseCount === "3+" && row.courses < 3) return false;

    if (progress === "High" && row.progress < 80) return false;
    if (progress === "Medium" && (row.progress < 50 || row.progress >= 80))
      return false;
    if (progress === "Low" && row.progress >= 50) return false;

    return true;
  });

  rows.sort((a, b) => a.name.localeCompare(b.name));

  const total = rows.length;
  const pageRows = rows
    .slice((page - 1) * limit, page * limit)
    .map(({ courseDetails, ...summary }) => summary);

  res.json({
    success: true,
    students: pageRows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
    stats,
    courses: courseOptions,
  });
});

/* ------------------------------------------------------------------ */
/* GET /api/instructor/students/:studentId                             */
/* ------------------------------------------------------------------ */

// @desc    One student's progress in each of the instructor's courses
// @access  Private (instructor)
export const getInstructorStudentDetail = asyncHandler(async (req, res) => {
  const courseMap = await loadInstructorCourses(req.user._id);
  const allCourseIds = [...courseMap.keys()];

  if (allCourseIds.length === 0) {
    res.status(404);
    throw new Error("Student not found");
  }

  const rows = await loadStudentRows(courseMap, allCourseIds);
  const student = rows.find((row) => row.id === String(req.params.studentId));

  // A student only appears here when enrolled in one of THIS instructor's courses.
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  res.json({ success: true, student });
});
