import asyncHandler from "express-async-handler";

import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import Instructor from "../models/Instructor.js";

/* ============================================================
   HELPER: RESOLVE INSTRUCTOR USER ID
============================================================ */

/*
  The frontend may send either:

  1. User._id
  2. Instructor._id

  Assignment.instructor must always store the User._id.

  This helper accepts either ID and returns the
  corresponding User._id.
*/

const resolveInstructorUser = async (instructorId) => {
  if (!instructorId) {
    return null;
  }

  /* ----------------------------------------------------------
     FIRST: Check if the ID belongs directly to a User
  ---------------------------------------------------------- */

  let user = await User.findById(instructorId)
    .select("_id name email phone role isActive")
    .lean();

  if (user) {
    if (user.role !== "instructor") {
      return null;
    }

    if (user.isActive === false) {
      return null;
    }

    return user;
  }

  /* ----------------------------------------------------------
     SECOND: Check if the ID belongs to an Instructor profile
  ---------------------------------------------------------- */

  const instructorProfile = await Instructor.findById(instructorId)
    .select("user status")
    .lean();

  if (!instructorProfile?.user) {
    return null;
  }

  /* ----------------------------------------------------------
     Get the actual User connected to the Instructor profile
  ---------------------------------------------------------- */

  user = await User.findById(instructorProfile.user)
    .select("_id name email phone role isActive")
    .lean();

  if (!user) {
    return null;
  }

  if (user.role !== "instructor") {
    return null;
  }

  if (user.isActive === false) {
    return null;
  }

  return user;
};

/* ============================================================
   GET ALL ASSIGNMENTS
============================================================ */

export const getAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find()
    .populate("course", "title category status")
    .populate("instructor", "name email")
    .sort({
      createdAt: -1,
    })
    .lean();

  const assignmentIds = assignments.map((assignment) => assignment._id);

  const submissionStats = await AssignmentSubmission.aggregate([
    {
      $match: {
        assignment: {
          $in: assignmentIds,
        },
      },
    },

    {
      $group: {
        _id: "$assignment",

        submissions: {
          $sum: 1,
        },

        graded: {
          $sum: {
            $cond: [
              {
                $eq: ["$status", "Graded"],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const statsMap = new Map();

  submissionStats.forEach((item) => {
    statsMap.set(item._id.toString(), {
      submissions: item.submissions,
      graded: item.graded,
    });
  });

  const data = assignments.map((assignment) => {
    const stats = statsMap.get(assignment._id.toString()) || {
      submissions: 0,
      graded: 0,
    };

    return {
      ...assignment,

      id: assignment._id,

      course: assignment.course
        ? {
            id: assignment.course._id,
            title: assignment.course.title,
            category: assignment.course.category,
            status: assignment.course.status,
          }
        : null,

      instructor: assignment.instructor
        ? {
            id: assignment.instructor._id,
            name: assignment.instructor.name,
            email: assignment.instructor.email,
          }
        : null,

      submissions: stats.submissions,
      graded: stats.graded,
    };
  });

  res.status(200).json({
    success: true,
    count: data.length,
    data,
  });
});

/* ============================================================
   GET ONE ASSIGNMENT
============================================================ */

export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate("course", "title description category status")
    .populate("instructor", "name email phone")
    .lean();

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  const submissions = await AssignmentSubmission.find({
    assignment: assignment._id,
  })
    .populate("student", "name email")
    .populate("gradedBy", "name email")
    .sort({
      submittedAt: -1,
    })
    .lean();

  res.status(200).json({
    success: true,

    data: {
      ...assignment,

      id: assignment._id,

      submissions,
    },
  });
});

/* ============================================================
   CREATE ASSIGNMENT
============================================================ */

export const createAssignment = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    instructions,
    course,
    instructor,
    type,
    points,
    submissionType,
    attachmentRequired,
    passingScore,
    dueDate,
    status,
    resources,
    allowLateSubmission,
    maxAttempts,
    moduleId,
    lessonId,
  } = req.body;

  /* ----------------------------------------------------------
     REQUIRED FIELDS
  ---------------------------------------------------------- */

  if (!title || !course) {
    res.status(400);
    throw new Error("Title and course are required");
  }

  /* ----------------------------------------------------------
     VERIFY COURSE
  ---------------------------------------------------------- */

  const courseDoc = await Course.findById(course);

  if (!courseDoc) {
    res.status(404);
    throw new Error("Course not found");
  }

  /* ----------------------------------------------------------
     DETERMINE INSTRUCTOR
  ---------------------------------------------------------- */

  /*
    If frontend sends an instructor, use it.

    Otherwise use the instructor attached to the course.
  */

  const instructorId = instructor || courseDoc.instructor;

  if (!instructorId) {
    res.status(400);
    throw new Error("Valid instructor is required");
  }

  /* ----------------------------------------------------------
     RESOLVE INSTRUCTOR
  ---------------------------------------------------------- */

  const instructorUser = await resolveInstructorUser(instructorId);

  if (!instructorUser) {
    res.status(400);
    throw new Error("Valid instructor is required");
  }

  /* ----------------------------------------------------------
     CREATE ASSIGNMENT
  ---------------------------------------------------------- */

  const assignment = await Assignment.create({
    title: title.trim(),

    description: description || "",

    instructions: instructions || "",

    course: courseDoc._id,

    /*
      IMPORTANT:
      Always store the USER ID here,
      never the Instructor profile ID.
    */
    instructor: instructorUser._id,

    type: type || "Assignment",

    submissionType: submissionType || "File Upload",

    attachmentRequired:
      attachmentRequired !== undefined ? attachmentRequired : false,

    points: points !== undefined ? Number(points) : 100,

    passingScore: passingScore !== undefined ? Number(passingScore) : 50,

    dueDate: dueDate || null,

    status: status || "Draft",

    publishedAt: status === "Published" ? new Date() : null,

    resources: resources || [],

    allowLateSubmission:
      allowLateSubmission !== undefined ? allowLateSubmission : true,

    maxAttempts: maxAttempts !== undefined ? Number(maxAttempts) : 1,

    moduleId: moduleId || null,

    lessonId: lessonId || null,
  });

  /* ----------------------------------------------------------
     RETURN POPULATED ASSIGNMENT
  ---------------------------------------------------------- */

  const populated = await Assignment.findById(assignment._id)
    .populate("course", "title category status")
    .populate("instructor", "name email phone");

  res.status(201).json({
    success: true,

    message: "Assignment created successfully",

    data: populated,
  });
});

/* ============================================================
   UPDATE ASSIGNMENT
============================================================ */

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  const {
    title,
    description,
    instructions,
    course,
    instructor,
    type,
    points,
    passingScore,
    submissionType,
    attachmentRequired,
    dueDate,
    status,
    resources,
    allowLateSubmission,
    maxAttempts,
    moduleId,
    lessonId,
  } = req.body;

  /* ----------------------------------------------------------
     BASIC FIELDS
  ---------------------------------------------------------- */

  if (title !== undefined) {
    assignment.title = title.trim();
  }

  if (description !== undefined) {
    assignment.description = description;
  }

  if (instructions !== undefined) {
    assignment.instructions = instructions;
  }

  if (type !== undefined) {
    assignment.type = type;
  }

  if (points !== undefined) {
    assignment.points = Number(points);
  }

  if (passingScore !== undefined) {
    assignment.passingScore = Number(passingScore);
  }

  if (dueDate !== undefined) {
    assignment.dueDate = dueDate || null;
  }

  //   if (status !== undefined) {
  //     assignment.status = status;
  //   }

  if (status !== undefined) {
    assignment.status = status;

    if (status === "Published" && !assignment.publishedAt) {
      assignment.publishedAt = new Date();
    }

    if (status === "Draft") {
      assignment.publishedAt = null;
    }
  }

  if (resources !== undefined) {
    assignment.resources = resources;
  }

  if (allowLateSubmission !== undefined) {
    assignment.allowLateSubmission = allowLateSubmission;
  }

  if (maxAttempts !== undefined) {
    assignment.maxAttempts = Number(maxAttempts);
  }

  if (moduleId !== undefined) {
    assignment.moduleId = moduleId || null;
  }

  if (lessonId !== undefined) {
    assignment.lessonId = lessonId || null;
  }

  if (submissionType !== undefined) {
    assignment.submissionType = submissionType || null;
  }

  if (attachmentRequired !== undefined) {
    assignment.attachmentRequired = attachmentRequired || null;
  }

  /* ----------------------------------------------------------
     COURSE
  ---------------------------------------------------------- */

  if (course !== undefined) {
    const courseDoc = await Course.findById(course);

    if (!courseDoc) {
      res.status(404);
      throw new Error("Course not found");
    }

    assignment.course = courseDoc._id;

    /*
      If the instructor wasn't explicitly changed,
      use the instructor attached to the new course.
    */

    if (instructor === undefined) {
      const courseInstructor = await resolveInstructorUser(
        courseDoc.instructor,
      );

      if (!courseInstructor) {
        res.status(400);
        throw new Error("The selected course does not have a valid instructor");
      }

      assignment.instructor = courseInstructor._id;
    }
  }

  /* ----------------------------------------------------------
     INSTRUCTOR
  ---------------------------------------------------------- */

  if (instructor !== undefined) {
    const instructorUser = await resolveInstructorUser(instructor);

    if (!instructorUser) {
      res.status(400);
      throw new Error("Invalid instructor");
    }

    assignment.instructor = instructorUser._id;
  }

  /* ----------------------------------------------------------
     SAVE
  ---------------------------------------------------------- */

  await assignment.save();

  /* ----------------------------------------------------------
     RETURN UPDATED ASSIGNMENT
  ---------------------------------------------------------- */

  const updated = await Assignment.findById(assignment._id)
    .populate("course", "title category status")
    .populate("instructor", "name email");

  res.status(200).json({
    success: true,

    message: "Assignment updated successfully",

    data: updated,
  });
});

/* ============================================================
   DELETE ASSIGNMENT
============================================================ */

export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  /* ----------------------------------------------------------
     REMOVE SUBMISSIONS FIRST
  ---------------------------------------------------------- */

  await AssignmentSubmission.deleteMany({
    assignment: assignment._id,
  });

  /* ----------------------------------------------------------
     REMOVE ASSIGNMENT
  ---------------------------------------------------------- */

  await Assignment.findByIdAndDelete(assignment._id);

  res.status(200).json({
    success: true,

    message: "Assignment deleted successfully",
  });
});

/* ============================================================
   UPDATE ASSIGNMENT STATUS
============================================================ */

export const updateAssignmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const allowedStatuses = ["Draft", "Published", "Closed"];

  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid assignment status");
  }

  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  assignment.status = status;

  if (status === "Published" && !assignment.publishedAt) {
    assignment.publishedAt = new Date();
  }

  if (status === "Draft") {
    assignment.publishedAt = null;
  }

  await assignment.save();

  res.status(200).json({
    success: true,

    message: `Assignment status changed to ${status}`,

    data: {
      id: assignment._id,

      status: assignment.status,
    },
  });
});
