import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";

const TYPES = ["Assignment", "Practical", "Project", "Quiz", "Case Study"];
const SUBMISSION_TYPES = ["File Upload", "Text Submission", "Both"];
const STATUSES = ["Draft", "Published", "Closed"];
const COUNTED_ENROLLMENT_STATUSES = ["active", "completed"];

const clean = (value, max) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

const readFields = (body, res) => {
  const fail = (message) => {
    res.status(400);
    throw new Error(message);
  };

  const title = clean(body.title, 150);
  if (!title) fail("Title is required");
  if (!mongoose.isValidObjectId(body.course)) fail("Please choose a course");

  const points = Number(body.points);
  if (!Number.isFinite(points) || points <= 0 || points > 1000) {
    fail("Maximum points must be between 1 and 1000");
  }

  const dueDate = new Date(body.dueDate);
  if (!body.dueDate || Number.isNaN(dueDate.getTime())) {
    fail("A valid due date is required");
  }

  const submissionType = SUBMISSION_TYPES.includes(body.submissionType)
    ? body.submissionType
    : "File Upload";

  const resources = (Array.isArray(body.resources) ? body.resources : [])
    .slice(0, 10)
    .map((resource) => ({
      name: clean(resource?.name || resource?.url, 150),
      url: clean(resource?.url, 500),
      type: "Link",
    }));

  if (resources.some((resource) => !/^https?:\/\/\S+$/i.test(resource.url))) {
    fail("Resource links must start with http:// or https://");
  }

  return {
    title,
    course: body.course,
    type: TYPES.includes(body.type) ? body.type : "Assignment",
    description: clean(body.description, 1000),
    instructions: clean(body.instructions, 5000),
    points,
    dueDate,
    submissionType,
    attachmentRequired:
      submissionType === "Both" ? Boolean(body.attachmentRequired) : false,
    allowLateSubmission: body.allowLateSubmission !== false,
    status: STATUSES.includes(body.status) ? body.status : "Draft",
    resources,
  };
};

const ensureOwnCourse = async (courseId, user, res) => {
  const course = await Course.findOne({ _id: courseId, instructor: user._id })
    .select("_id")
    .lean();

  if (!course) {
    res.status(403);
    throw new Error("You can only create assignments for your own courses");
  }
};

const findOwned = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  const assignment = await Assignment.findOne({
    _id: req.params.id,
    instructor: req.user._id,
  }).populate("course", "title");

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  return assignment;
};

// Turns plain assignment objects (course populated) into API items with live stats
const buildItems = async (assignments) => {
  if (assignments.length === 0) return [];

  const assignmentIds = assignments.map((item) => item._id);

  const courseIds = [
    ...new Map(
      assignments
        .filter((item) => item.course)
        .map((item) => [String(item.course._id), item.course._id]),
    ).values(),
  ];

  const [submissionRows, enrollmentRows] = await Promise.all([
    AssignmentSubmission.aggregate([
      { $match: { assignment: { $in: assignmentIds } } },
      {
        $group: {
          _id: "$assignment",
          submissions: { $sum: 1 },
          graded: {
            $sum: { $cond: [{ $eq: ["$status", "Graded"] }, 1, 0] },
          },
          pending: {
            $sum: {
              $cond: [{ $in: ["$status", ["Submitted", "Late"]] }, 1, 0],
            },
          },
        },
      },
    ]),
    courseIds.length
      ? CourseEnrollment.aggregate([
          {
            $match: {
              course: { $in: courseIds },
              status: { $in: COUNTED_ENROLLMENT_STATUSES },
            },
          },
          { $group: { _id: "$course", students: { $sum: 1 } } },
        ])
      : [],
  ]);

  const submissionsById = new Map(
    submissionRows.map((row) => [String(row._id), row]),
  );
  const studentsByCourse = new Map(
    enrollmentRows.map((row) => [String(row._id), row.students]),
  );

  return assignments.map((item) => {
    const stats = submissionsById.get(String(item._id));

    return {
      id: String(item._id),
      title: item.title,
      description: item.description || "",
      instructions: item.instructions || "",
      courseId: item.course ? String(item.course._id) : "",
      course: item.course?.title || "Course",
      type: item.type,
      submissionType: item.submissionType,
      attachmentRequired: Boolean(item.attachmentRequired),
      allowLateSubmission: Boolean(item.allowLateSubmission),
      points: item.points,
      dueDate: item.dueDate || null,
      status: item.status,
      resources: (item.resources || []).map((resource) => ({
        id: String(resource._id),
        name: resource.name,
        url: resource.url,
      })),
      students: item.course
        ? studentsByCourse.get(String(item.course._id)) || 0
        : 0,
      submissions: stats?.submissions || 0,
      graded: stats?.graded || 0,
      pending: stats?.pending || 0,
      createdAt: item.createdAt,
    };
  });
};

const applyStatus = (assignment, status) => {
  assignment.status = status;

  if (status === "Published" && !assignment.publishedAt) {
    assignment.publishedAt = new Date();
  }

  if (status === "Draft") {
    assignment.publishedAt = null;
  }
};

// GET /api/instructor/assignments
export const getAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ instructor: req.user._id })
    .populate("course", "title")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, assignments: await buildItems(assignments) });
});

// GET /api/instructor/assignments/:id
export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await findOwned(req, res);
  const [item] = await buildItems([assignment.toObject({ transform: false })]);

  res.json({ success: true, assignment: item });
});

// POST /api/instructor/assignments
export const createAssignment = asyncHandler(async (req, res) => {
  const fields = readFields(req.body, res);
  await ensureOwnCourse(fields.course, req.user, res);

  const assignment = await Assignment.create({
    ...fields,
    instructor: req.user._id,
    publishedAt: fields.status === "Published" ? new Date() : null,
  });

  await assignment.populate("course", "title");
  const [item] = await buildItems([assignment.toObject({ transform: false })]);

  res.status(201).json({
    success: true,
    message:
      fields.status === "Published"
        ? "Assignment published successfully"
        : "Assignment saved",
    assignment: item,
  });
});

// PATCH /api/instructor/assignments/:id
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await findOwned(req, res);

  const fields = readFields(req.body, res);
  await ensureOwnCourse(fields.course, req.user, res);

  const { status, ...rest } = fields;
  Object.assign(assignment, rest);
  applyStatus(assignment, status);

  await assignment.save();
  await assignment.populate("course", "title");

  const [item] = await buildItems([assignment.toObject({ transform: false })]);

  res.json({
    success: true,
    message: "Assignment updated successfully",
    assignment: item,
  });
});

// PATCH /api/instructor/assignments/:id/status
export const updateAssignmentStatus = asyncHandler(async (req, res) => {
  const assignment = await findOwned(req, res);

  if (!STATUSES.includes(req.body.status)) {
    res.status(400);
    throw new Error("Invalid assignment status");
  }

  applyStatus(assignment, req.body.status);
  await assignment.save();

  const [item] = await buildItems([assignment.toObject({ transform: false })]);

  res.json({
    success: true,
    message: `Assignment is now ${req.body.status.toLowerCase()}`,
    assignment: item,
  });
});

// POST /api/instructor/assignments/:id/duplicate
export const duplicateAssignment = asyncHandler(async (req, res) => {
  const source = await findOwned(req, res);

  const copy = await Assignment.create({
    title: `${source.title} (Copy)`.slice(0, 150),
    description: source.description,
    instructions: source.instructions,
    course: source.course._id,
    instructor: req.user._id,
    type: source.type,
    submissionType: source.submissionType,
    attachmentRequired: source.attachmentRequired,
    points: source.points,
    passingScore: source.passingScore,
    dueDate: source.dueDate,
    allowLateSubmission: source.allowLateSubmission,
    maxAttempts: source.maxAttempts,
    resources: source.resources.map((resource) => ({
      name: resource.name,
      type: resource.type,
      url: resource.url,
      publicId: resource.publicId,
    })),
    status: "Draft",
    publishedAt: null,
  });

  await copy.populate("course", "title");
  const [item] = await buildItems([copy.toObject({ transform: false })]);

  res.status(201).json({
    success: true,
    message: "Assignment duplicated as a draft",
    assignment: item,
  });
});

// DELETE /api/instructor/assignments/:id
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await findOwned(req, res);

  // Never delete work students have already handed in
  const submissions = await AssignmentSubmission.countDocuments({
    assignment: assignment._id,
  });

  if (submissions > 0) {
    res.status(409);
    throw new Error(
      `This assignment already has ${submissions} submission${
        submissions === 1 ? "" : "s"
      }. Close it instead of deleting it.`,
    );
  }

  await assignment.deleteOne();

  res.json({ success: true, message: "Assignment deleted successfully" });
});
