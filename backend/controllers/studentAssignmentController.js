import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import cloudinary from "../utils/cloudinary.js";
import { getEnrolledCourseIds } from "../utils/studentEnrollments.js";

const VISIBLE_STATUSES = ["Published", "Closed"];
const MAX_TEXT_LENGTH = 20000;
const STATUS_ORDER = { Pending: 0, Submitted: 1, Graded: 2 };

/* ------------------------------ helpers ------------------------------ */

const userName = (user) =>
  user?.name ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  "Instructor";

const getResourceType = (url = "") =>
  url.match(/\/(image|video|raw)\/upload\//)?.[1] || "raw";

// Best-effort cleanup when a request fails after Cloudinary already stored files
const removeUploadedFiles = async (files = []) => {
  await Promise.allSettled(
    files.map((file) =>
      cloudinary.uploader.destroy(file.filename, {
        resource_type: getResourceType(file.path),
      }),
    ),
  );
};

const formatSubmission = (submission) => {
  const graded = submission.status === "Graded";

  return {
    id: String(submission._id),
    attempt: submission.attempt,
    status: submission.status,
    textContent: submission.textContent || "",
    attachments: (submission.attachments || []).map((file) => ({
      id: String(file._id),
      name: file.name,
      url: file.url,
      mimeType: file.mimeType,
      size: file.size,
    })),
    isLate: Boolean(submission.isLate),
    submittedAt: submission.submittedAt,
    score: graded ? submission.score : null,
    feedback: graded ? submission.feedback || "" : "",
    gradedAt: graded ? submission.gradedAt : null,
  };
};

// What the student sees for one assignment (list + detail share this)
const buildListView = (assignment, submissions) => {
  const latest = submissions[submissions.length - 1] || null;
  const attemptsUsed = submissions.length;
  const maxAttempts = assignment.maxAttempts || 1;
  const pastDue =
    Boolean(assignment.dueDate) && new Date() > new Date(assignment.dueDate);
  const isClosed = assignment.status === "Closed";

  let status = "Pending";
  if (latest) status = latest.status === "Graded" ? "Graded" : "Submitted";

  let submitBlockedReason = "";
  if (isClosed) {
    submitBlockedReason =
      "This assignment is closed and no longer accepts submissions.";
  } else if (latest?.status === "Graded") {
    submitBlockedReason = "This assignment has already been graded.";
  } else if (attemptsUsed >= maxAttempts) {
    submitBlockedReason = `You have used all ${maxAttempts} allowed attempt${
      maxAttempts === 1 ? "" : "s"
    }.`;
  } else if (pastDue && !assignment.allowLateSubmission) {
    submitBlockedReason =
      "The due date has passed and late submissions are not accepted.";
  }

  return {
    id: String(assignment._id),
    title: assignment.title,
    description: assignment.description || "",
    type: assignment.type,
    course: assignment.course?.title || "Course",
    courseId: assignment.course?._id ? String(assignment.course._id) : null,
    instructor: userName(assignment.instructor),
    dueDate: assignment.dueDate || null,
    totalMarks: assignment.points,
    submissionType: assignment.submissionType,
    attachmentRequired: Boolean(assignment.attachmentRequired),
    allowLateSubmission: Boolean(assignment.allowLateSubmission),
    maxAttempts,
    attemptsUsed,
    status,
    score: latest?.status === "Graded" ? latest.score : null,
    isLate: Boolean(latest?.isLate),
    isOverdue: status === "Pending" && pastDue,
    isClosed,
    canSubmit: !submitBlockedReason,
    submitBlockedReason,
    submittedAt: latest?.submittedAt || null,
  };
};

const buildDetailView = (assignment, submissions) => ({
  ...buildListView(assignment, submissions),
  instructions: assignment.instructions || "",
  resources: (assignment.resources || []).map((resource) => ({
    id: String(resource._id),
    name: resource.name,
    type: resource.type,
    url: resource.url,
  })),
  submissions: submissions.map(formatSubmission),
});

// Loads an assignment the student is allowed to see, plus their submissions
const loadAssignmentContext = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  const assignment = await Assignment.findOne({
    _id: id,
    status: { $in: VISIBLE_STATUSES },
  })
    .populate("course", "title")
    .populate("instructor", "name firstName lastName")
    .lean();

  if (!assignment?.course) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  const courseIds = await getEnrolledCourseIds(req.user);

  if (!courseIds.includes(String(assignment.course._id))) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  const submissions = await AssignmentSubmission.find({
    assignment: assignment._id,
    student: req.user._id,
  })
    .sort({ attempt: 1 })
    .lean();

  return { assignment, submissions };
};

/* ------------------------------ handlers ------------------------------ */

// GET /api/student/assignments
export const getMyAssignments = asyncHandler(async (req, res) => {
  const courseIds = await getEnrolledCourseIds(req.user);

  if (courseIds.length === 0) {
    return res.json({ success: true, assignments: [] });
  }

  const assignments = await Assignment.find({
    course: { $in: courseIds },
    status: { $in: VISIBLE_STATUSES },
  })
    .populate("course", "title")
    .populate("instructor", "name firstName lastName")
    .lean();

  const submissions = await AssignmentSubmission.find({
    student: req.user._id,
    assignment: { $in: assignments.map((item) => item._id) },
  })
    .sort({ attempt: 1 })
    .lean();

  const byAssignment = new Map();
  submissions.forEach((submission) => {
    const key = String(submission.assignment);
    byAssignment.set(key, [...(byAssignment.get(key) || []), submission]);
  });

  const views = assignments
    .filter((assignment) => assignment.course)
    .map((assignment) =>
      buildListView(assignment, byAssignment.get(String(assignment._id)) || []),
    )
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        new Date(a.dueDate || 8.64e15) - new Date(b.dueDate || 8.64e15),
    );

  res.json({ success: true, assignments: views });
});

// GET /api/student/assignments/:id
export const getMyAssignment = asyncHandler(async (req, res) => {
  const { assignment, submissions } = await loadAssignmentContext(req, res);

  res.json({
    success: true,
    assignment: buildDetailView(assignment, submissions),
  });
});

// Runs BEFORE the file upload so ineligible students never upload anything
export const prepareSubmission = asyncHandler(async (req, res, next) => {
  const context = await loadAssignmentContext(req, res);
  const view = buildListView(context.assignment, context.submissions);

  if (!view.canSubmit) {
    res.status(400);
    throw new Error(view.submitBlockedReason);
  }

  req.submissionContext = context;
  next();
});

// POST /api/student/assignments/:id/submit  (multipart/form-data)
export const submitAssignment = asyncHandler(async (req, res) => {
  const { assignment, submissions } = req.submissionContext;
  const files = req.files || [];
  const type = assignment.submissionType;

  const reject = async (message) => {
    await removeUploadedFiles(files);
    res.status(400);
    throw new Error(message);
  };

  const acceptsText = type !== "File Upload";
  const acceptsFiles = type !== "Text Submission";
  const textContent = acceptsText ? (req.body.textContent || "").trim() : "";

  if (!acceptsFiles && files.length > 0) {
    await reject("This assignment only accepts a written answer.");
  }

  if (textContent.length > MAX_TEXT_LENGTH) {
    await reject(
      `Your answer is too long (max ${MAX_TEXT_LENGTH} characters).`,
    );
  }

  if (type === "Text Submission" && !textContent) {
    await reject("Please write your answer before submitting.");
  }

  if (type === "File Upload" && files.length === 0) {
    await reject("Please attach at least one file.");
  }

  if (type === "Both") {
    if (!textContent && files.length === 0) {
      await reject("Please write an answer or attach a file.");
    }
    if (assignment.attachmentRequired && files.length === 0) {
      await reject("A file attachment is required for this assignment.");
    }
  }

  const now = new Date();
  let submission;

  try {
    submission = await AssignmentSubmission.create({
      assignment: assignment._id,
      student: req.user._id,
      course: assignment.course._id,
      attempt: submissions.length + 1,
      textContent,
      attachments: files.map((file) => ({
        name: file.originalname,
        url: file.path,
        publicId: file.filename,
        resourceType: getResourceType(file.path),
        mimeType: file.mimetype,
        size: file.size || 0,
      })),
      isLate: Boolean(assignment.dueDate) && now > new Date(assignment.dueDate),
      submittedAt: now,
    });
  } catch (error) {
    await removeUploadedFiles(files);

    if (error.code === 11000) {
      res.status(409);
      throw new Error(
        "This submission was already received. Please refresh the page.",
      );
    }
    throw error;
  }

  const allSubmissions = [
    ...submissions,
    submission.toObject({ transform: false }),
  ];

  res.status(201).json({
    success: true,
    message: "Assignment submitted successfully",
    assignment: buildDetailView(assignment, allSubmissions),
  });
});
