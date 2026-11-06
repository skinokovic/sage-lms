import asyncHandler from "express-async-handler";
import Course from "../models/Course.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Progress from "../models/Progress.js";
import { getEnrolledCourseIds } from "../utils/studentEnrollments.js";

// Matches the "Grading Scale" card on the Grades page
const GRADE_SCALE = [
  { min: 90, grade: "A", label: "Excellent" },
  { min: 80, grade: "B", label: "Very Good" },
  { min: 70, grade: "C", label: "Good" },
  { min: 60, grade: "D", label: "Pass" },
  { min: 0, grade: "F", label: "Fail" },
];

const getGradeInfo = (percent) =>
  GRADE_SCALE.find((item) => percent >= item.min) ||
  GRADE_SCALE[GRADE_SCALE.length - 1];

const userName = (user) =>
  user?.name ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  "Instructor";

// GET /api/student/grades
export const getMyGrades = asyncHandler(async (req, res) => {
  const courseIds = await getEnrolledCourseIds(req.user);

  if (courseIds.length === 0) {
    return res.json({ success: true, grades: [] });
  }

  const [courses, assignments, completedRows] = await Promise.all([
    Course.find({ _id: { $in: courseIds } })
      .select("title category instructor modules.lessons._id")
      .populate("instructor", "name firstName lastName")
      .lean(),
    Assignment.find({
      course: { $in: courseIds },
      status: { $in: ["Published", "Closed"] },
    })
      .select("course points")
      .lean(),
    Progress.find({
      userId: req.user._id,
      courseId: { $in: courseIds },
      completed: true,
    })
      .select("courseId lessonId")
      .lean(),
  ]);

  const assignmentIds = assignments.map((assignment) => assignment._id);

  const submissions = assignmentIds.length
    ? await AssignmentSubmission.find({
        student: req.user._id,
        status: "Graded",
        score: { $ne: null },
        assignment: { $in: assignmentIds },
      })
        .select("assignment score")
        .lean()
    : [];

  const assignmentById = new Map(
    assignments.map((assignment) => [String(assignment._id), assignment]),
  );

  const totalAssignmentsByCourse = new Map();
  assignments.forEach((assignment) => {
    const key = String(assignment.course);
    totalAssignmentsByCourse.set(
      key,
      (totalAssignmentsByCourse.get(key) || 0) + 1,
    );
  });

  // Marks earned / possible per course, from graded submissions only
  const gradedByCourse = new Map();
  submissions.forEach((submission) => {
    const assignment = assignmentById.get(String(submission.assignment));
    if (!assignment) return;

    const key = String(assignment.course);
    const entry = gradedByCourse.get(key) || {
      earned: 0,
      possible: 0,
      count: 0,
    };

    entry.earned += submission.score;
    entry.possible += assignment.points || 0;
    entry.count += 1;
    gradedByCourse.set(key, entry);
  });

  const doneByCourse = new Map();
  completedRows.forEach((row) => {
    const key = String(row.courseId);
    const set = doneByCourse.get(key) || new Set();
    set.add(String(row.lessonId));
    doneByCourse.set(key, set);
  });

  const grades = courses
    .map((course) => {
      const key = String(course._id);
      const stats = gradedByCourse.get(key);

      const percent =
        stats && stats.possible > 0
          ? Math.round((stats.earned / stats.possible) * 100)
          : null;
      const info = percent !== null ? getGradeInfo(percent) : null;

      const lessonIds = (course.modules || []).flatMap((courseModule) =>
        (courseModule.lessons || []).map((lesson) => String(lesson._id)),
      );
      const done = doneByCourse.get(key) || new Set();
      const completed =
        lessonIds.length > 0 && lessonIds.every((id) => done.has(id));

      return {
        id: key,
        course: course.title,
        category: course.category || "General",
        instructor: userName(course.instructor),
        score: stats ? stats.earned : null,
        totalMarks: stats ? stats.possible : 0,
        percent,
        grade: info ? info.grade : "—",
        status: info ? info.label : "No grades yet",
        completed,
        gradedAssignments: stats ? stats.count : 0,
        totalAssignments: totalAssignmentsByCourse.get(key) || 0,
      };
    })
    .sort(
      (a, b) =>
        Number(b.percent !== null) - Number(a.percent !== null) ||
        a.course.localeCompare(b.course),
    );

  res.json({ success: true, grades });
});
