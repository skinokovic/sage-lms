import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";

const clean = (value, max) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const statusLabel = (status) =>
  status === "Graded"
    ? "Graded"
    : status === "Returned"
      ? "Returned"
      : "Pending Review";

const isLate = (assignment, submission) =>
  submission.status === "Late" ||
  (Boolean(assignment.dueDate) &&
    new Date(submission.submittedAt) > new Date(assignment.dueDate));

const formatStudent = (student) => ({
  id: String(student?._id || ""),
  name: student?.name || "Student",
  email: student?.email || "",
  initials: initialsOf(student?.name),
  avatarUrl: student?.avatarUrl || "",
});

const formatRow = (submission, assignment) => ({
  id: String(submission._id),
  student: formatStudent(submission.student),
  assignmentId: String(assignment._id),
  assignment: assignment.title,
  course: assignment.course?.title || "Course",
  submittedAt: submission.submittedAt,
  score: submission.status === "Graded" ? submission.score : null,
  maxScore: assignment.points,
  status: statusLabel(submission.status),
  submittedLate: isLate(assignment, submission),
  submissionType: assignment.submissionType,
  fileName: submission.fileName || "",
});

const formatDetail = (submission, assignment) => ({
  id: String(submission._id),
  student: formatStudent(submission.student),
  status: statusLabel(submission.status),
  submittedAt: submission.submittedAt,
  submittedLate: isLate(assignment, submission),
  content: submission.content || "",
  file: submission.fileUrl
    ? {
        name: submission.fileName || "Attachment",
        url: submission.fileUrl,
      }
    : null,
  score: submission.status === "Graded" ? submission.score : null,
  feedback: submission.feedback || "",
  instructorNotes: submission.instructorNotes || "",
  gradedAt: submission.gradedAt || null,
  assignment: {
    id: String(assignment._id),
    title: assignment.title,
    course: assignment.course?.title || "Course",
    description: assignment.description || "",
    instructions: assignment.instructions || "",
    points: assignment.points,
    dueDate: assignment.dueDate || null,
    submissionType: assignment.submissionType,
  },
});

// Loads a submission, but only when it belongs to one of this instructor's assignments
const loadOwned = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(404);
    throw new Error("Submission not found");
  }

  const submission = await AssignmentSubmission.findById(id).populate(
    "student",
    "name email avatarUrl",
  );

  if (!submission) {
    res.status(404);
    throw new Error("Submission not found");
  }

  const assignment = await Assignment.findOne({
    _id: submission.assignment,
    instructor: req.user._id,
  }).populate("course", "title");

  if (!assignment) {
    res.status(404);
    throw new Error("Submission not found");
  }

  return { submission, assignment };
};

// Notes are saved together with a grade/return when the page sends them
const applyNotes = (submission, body) => {
  if (typeof body.instructorNotes === "string") {
    submission.instructorNotes = clean(body.instructorNotes, 2000);
  }
};

// GET /api/instructor/submissions
export const getSubmissions = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ instructor: req.user._id })
    .select("title points dueDate submissionType course")
    .populate("course", "title")
    .lean();

  if (assignments.length === 0) {
    return res.json({ success: true, submissions: [] });
  }

  const assignmentById = new Map(
    assignments.map((assignment) => [String(assignment._id), assignment]),
  );

  const submissions = await AssignmentSubmission.find({
    assignment: { $in: assignments.map((assignment) => assignment._id) },
  })
    .populate("student", "name email avatarUrl")
    .lean();

  const rows = submissions
    .map((submission) => {
      const assignment = assignmentById.get(String(submission.assignment));
      return assignment ? formatRow(submission, assignment) : null;
    })
    .filter(Boolean);

  // Waiting for review first (oldest first), then returned, then graded (newest first)
  const rank = { "Pending Review": 0, Returned: 1, Graded: 2 };

  rows.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      (a.status === "Pending Review"
        ? new Date(a.submittedAt) - new Date(b.submittedAt)
        : new Date(b.submittedAt) - new Date(a.submittedAt)),
  );

  res.json({ success: true, submissions: rows });
});

// GET /api/instructor/submissions/:id
export const getSubmission = asyncHandler(async (req, res) => {
  const { submission, assignment } = await loadOwned(req, res);

  res.json({
    success: true,
    submission: formatDetail(submission, assignment),
  });
});

// PATCH /api/instructor/submissions/:id/notes
export const saveNotes = asyncHandler(async (req, res) => {
  const { submission, assignment } = await loadOwned(req, res);

  submission.instructorNotes = clean(req.body.instructorNotes, 2000);
  await submission.save();

  res.json({
    success: true,
    message: "Notes saved",
    submission: formatDetail(submission, assignment),
  });
});

// PATCH /api/instructor/submissions/:id/grade
export const gradeSubmission = asyncHandler(async (req, res) => {
  const { submission, assignment } = await loadOwned(req, res);

  const score = Number(req.body.score);

  if (
    req.body.score === "" ||
    req.body.score === null ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > assignment.points
  ) {
    res.status(400);
    throw new Error(
      `Score must be a number between 0 and ${assignment.points}`,
    );
  }

  submission.score = Math.round(score * 100) / 100;
  submission.feedback = clean(req.body.feedback, 2000);
  submission.status = "Graded";
  submission.gradedBy = req.user._id;
  submission.gradedAt = new Date();
  applyNotes(submission, req.body);

  await submission.save();

  res.json({
    success: true,
    message: "Grade saved",
    submission: formatDetail(submission, assignment),
  });
});

// PATCH /api/instructor/submissions/:id/return
// Sends the work back so the student can fix it and submit again
export const returnSubmission = asyncHandler(async (req, res) => {
  const { submission, assignment } = await loadOwned(req, res);

  const feedback = clean(req.body.feedback, 2000);

  if (!feedback) {
    res.status(400);
    throw new Error("Please explain what the student needs to improve");
  }

  submission.status = "Returned";
  submission.feedback = feedback;
  submission.score = null;
  submission.gradedBy = null;
  submission.gradedAt = null;
  applyNotes(submission, req.body);

  await submission.save();

  res.json({
    success: true,
    message: "Submission returned to the student",
    submission: formatDetail(submission, assignment),
  });
});
