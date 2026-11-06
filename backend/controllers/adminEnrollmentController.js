import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";

// Payment methods an admin can record without going through Paystack.
const MANUAL_METHODS = ["bank_transfer", "cash", "complimentary"];

// Enrollments with these statuses already give the student access.
const ACCESS_STATUSES = ["active", "completed"];

const MAX_COURSES_PER_REQUEST = 20;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ------------------------------------------------------------------ */
/* GET /api/admin/enrollments/students?search=                         */
/* ------------------------------------------------------------------ */

// @desc    Find registered students by name or email (for the picker)
// @access  Private (admin)
export const searchStudents = asyncHandler(async (req, res) => {
  const search = String(req.query.search || "").trim();

  if (search.length < 2) {
    return res.json({ success: true, students: [] });
  }

  const pattern = new RegExp(escapeRegex(search), "i");

  const students = await User.find({
    role: "student",
    $or: [{ name: pattern }, { email: pattern }],
  })
    .select("name email phone isActive")
    .sort({ name: 1 })
    .limit(10)
    .lean();

  res.json({
    success: true,
    students: students.map((student) => ({
      id: String(student._id),
      name: student.name,
      email: student.email,
      phone: student.phone || "",
      isActive: student.isActive !== false,
    })),
  });
});

/* ------------------------------------------------------------------ */
/* GET /api/admin/enrollments/courses                                  */
/* ------------------------------------------------------------------ */

// @desc    Published courses a student can be enrolled in
// @access  Private (admin)
export const getEnrollableCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ status: "Published" })
    .select("title price category")
    .sort({ title: 1 })
    .lean();

  res.json({
    success: true,
    courses: courses.map((course) => ({
      id: String(course._id),
      title: course.title,
      price: course.price || 0,
      category: course.category || "",
    })),
  });
});

/* ------------------------------------------------------------------ */
/* POST /api/admin/enrollments                                         */
/* ------------------------------------------------------------------ */

// @desc    Enroll a registered student in one or more courses, recording a
//          payment made outside Paystack (bank transfer, cash) or a free place
// @body    { studentId, items: [{ courseId, amountPaid? }], paymentMethod,
//            paymentReference?, note? }
// @access  Private (admin)
export const enrollStudent = asyncHandler(async (req, res) => {
  const { studentId, items, paymentMethod } = req.body;
  const paymentReference = String(req.body.paymentReference || "").trim();
  const note = String(req.body.note || "").trim();

  if (!studentId || !mongoose.isValidObjectId(studentId)) {
    res.status(400);
    throw new Error("Choose a student to enroll.");
  }

  if (!MANUAL_METHODS.includes(paymentMethod)) {
    res.status(400);
    throw new Error("Choose how the student paid.");
  }

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > MAX_COURSES_PER_REQUEST
  ) {
    res.status(400);
    throw new Error(
      `Choose between 1 and ${MAX_COURSES_PER_REQUEST} courses to enroll the student in.`,
    );
  }

  if (paymentReference.length > 100) {
    res.status(400);
    throw new Error("The payment reference is too long.");
  }

  if (note.length > 500) {
    res.status(400);
    throw new Error("The note must be 500 characters or fewer.");
  }

  const student = await User.findById(studentId).select(
    "name email phone role isActive",
  );

  if (!student || student.role !== "student") {
    res.status(404);
    throw new Error("Student not found.");
  }

  if (student.isActive === false) {
    res.status(400);
    throw new Error(
      "This student's account is deactivated. Reactivate it before enrolling them.",
    );
  }

  // A course can only be listed once per request.
  const seen = new Set();
  const requested = items.filter((item) => {
    const key = String(item?.courseId || "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const results = [];

  for (const item of requested) {
    const courseId = String(item?.courseId || "");

    if (!mongoose.isValidObjectId(courseId)) {
      results.push({
        courseId,
        title: "Unknown course",
        outcome: "skipped",
        message: "This course ID is not valid.",
      });
      continue;
    }

    const course = await Course.findById(courseId).select("title price status");

    if (!course) {
      results.push({
        courseId,
        title: "Unknown course",
        outcome: "skipped",
        message: "Course not found.",
      });
      continue;
    }

    // Students can only open published courses, so only those can be enrolled.
    if (course.status !== "Published") {
      results.push({
        courseId,
        title: course.title,
        outcome: "skipped",
        message: "This course is not published yet.",
      });
      continue;
    }

    // Complimentary places record no payment; otherwise default to the price.
    let amountPaid = 0;
    if (paymentMethod !== "complimentary") {
      amountPaid =
        item.amountPaid === undefined ||
        item.amountPaid === null ||
        item.amountPaid === ""
          ? Number(course.price || 0)
          : Number(item.amountPaid);

      if (!Number.isFinite(amountPaid) || amountPaid < 0) {
        results.push({
          courseId,
          title: course.title,
          outcome: "skipped",
          message: "The amount paid is not valid.",
        });
        continue;
      }
    }

    const existing = await CourseEnrollment.findOne({
      course: course._id,
      $or: [{ user: student._id }, { studentEmail: student.email }],
    });

    if (existing && ACCESS_STATUSES.includes(existing.status)) {
      results.push({
        courseId,
        title: course.title,
        outcome: "already_enrolled",
        message: "Already enrolled in this course.",
      });
      continue;
    }

    const details = {
      user: student._id,
      studentEmail: student.email,
      studentName: student.name,
      studentPhone: student.phone || "",
      status: "active",
      paymentMethod,
      amountPaid,
      paymentReference,
      enrolledBy: req.user._id,
      note,
      enrolledAt: new Date(),
    };

    try {
      if (existing) {
        // A revoked enrollment is switched back on instead of duplicated.
        existing.set(details);
        await existing.save();

        results.push({
          courseId,
          title: course.title,
          outcome: "reactivated",
          message: "Enrollment restored.",
        });
      } else {
        await CourseEnrollment.create({ course: course._id, ...details });

        results.push({
          courseId,
          title: course.title,
          outcome: "enrolled",
          message: "Enrolled successfully.",
        });
      }
    } catch (error) {
      // Two admins enrolling the same student at once hit the unique index.
      if (error?.code === 11000) {
        results.push({
          courseId,
          title: course.title,
          outcome: "already_enrolled",
          message: "Already enrolled in this course.",
        });
      } else {
        throw error;
      }
    }
  }

  res.status(200).json({
    success: true,
    student: {
      id: String(student._id),
      name: student.name,
      email: student.email,
    },
    enrolledCount: results.filter(
      (result) =>
        result.outcome === "enrolled" || result.outcome === "reactivated",
    ).length,
    results,
  });
});
