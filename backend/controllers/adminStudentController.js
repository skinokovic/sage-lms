import bcrypt from "bcryptjs";
import User from "../models/User.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import formatRelativeTime from "../utils/formatRelativeTime.js";

// Enrollments with these statuses count towards a student's courses.
const COUNTED_STATUSES = ["active", "completed"];

// --------------------------------------------------
// Shared response shape, used by every endpoint below
// except createStudent (left as-is since the Create
// Student page already works against it).
// --------------------------------------------------

const formatStudent = (student, counts = { courses: 0, completed: 0 }) => {
  const status = !student.isActive
    ? "Inactive"
    : student.mustChangePassword
      ? "Pending"
      : "Active";

  return {
    id: student._id,
    name: student.name,
    email: student.email,
    phone: student.phone || "",
    status,
    isActive: student.isActive,
    mustChangePassword: student.mustChangePassword,
    courses: counts.courses,
    completed: counts.completed,
    joined: student.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    lastActive: formatRelativeTime(student.lastLoginAt),
  };
};

// --------------------------------------------------
// Real course counts from the CourseEnrollment collection.
// An enrollment belongs to a student by account id, or by email for
// enrollments created from a payment before accounts were linked.
// --------------------------------------------------

// For the list page: one query for every student on the page.
const loadCountsForStudents = async (students) => {
  const countsById = new Map(
    students.map((student) => [String(student._id), new Map()]),
  );

  if (students.length === 0) return new Map();

  const idByEmail = new Map(
    students.map((student) => [
      String(student.email || "").toLowerCase(),
      String(student._id),
    ]),
  );

  const enrollments = await CourseEnrollment.find({
    status: { $in: COUNTED_STATUSES },
    $or: [
      { user: { $in: students.map((student) => student._id) } },
      { studentEmail: { $in: [...idByEmail.keys()] } },
    ],
  })
    .select("user studentEmail course status")
    .lean();

  enrollments.forEach((enrollment) => {
    const ownerId =
      (enrollment.user &&
        countsById.has(String(enrollment.user)) &&
        String(enrollment.user)) ||
      idByEmail.get(String(enrollment.studentEmail || "").toLowerCase());

    if (!ownerId) return;

    // One entry per course, even if both the id and the email match.
    countsById.get(ownerId).set(String(enrollment.course), enrollment.status);
  });

  return new Map(
    [...countsById.entries()].map(([id, courseMap]) => [
      id,
      {
        courses: courseMap.size,
        completed: [...courseMap.values()].filter(
          (status) => status === "completed",
        ).length,
      },
    ]),
  );
};

// For one student: the counts plus the list of enrolled courses.
const buildStudentResponse = async (student) => {
  const enrollments = await CourseEnrollment.find({
    $or: [{ user: student._id }, { studentEmail: student.email }],
  })
    .sort({ enrolledAt: -1 })
    .populate("course", "title")
    .lean();

  // Courses that still exist; revoked ones are listed but not counted.
  const usable = enrollments.filter((enrollment) => enrollment.course);

  const live = new Map();
  usable
    .filter((enrollment) => COUNTED_STATUSES.includes(enrollment.status))
    .forEach((enrollment) =>
      live.set(String(enrollment.course._id), enrollment.status),
    );

  const counts = {
    courses: live.size,
    completed: [...live.values()].filter((status) => status === "completed")
      .length,
  };

  return {
    ...formatStudent(student, counts),
    enrolledCourses: usable.map((enrollment) => ({
      enrollmentId: String(enrollment._id),
      courseId: String(enrollment.course._id),
      title: enrollment.course.title,
      status: enrollment.status,
      paymentMethod: enrollment.paymentMethod || "paystack",
      amountPaid: enrollment.amountPaid || 0,
      enrolledAt: enrollment.enrolledAt,
    })),
  };
};

export const createStudent = async (req, res) => {
  try {
    const { name, email, phone, temporaryPassword } = req.body;

    // --------------------------------------------------
    // 1. Validate required fields
    // --------------------------------------------------

    if (!name || !email || !temporaryPassword) {
      return res.status(400).json({
        success: false,
        message: "Name, email and temporary password are required.",
      });
    }

    // --------------------------------------------------
    // 2. Validate password length
    // --------------------------------------------------

    if (temporaryPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Temporary password must be at least 8 characters.",
      });
    }

    // --------------------------------------------------
    // 3. Clean email
    // --------------------------------------------------

    const normalizedEmail = email.trim().toLowerCase();

    // --------------------------------------------------
    // 4. Check whether account already exists
    // --------------------------------------------------

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    // --------------------------------------------------
    // 5. Hash temporary password
    // --------------------------------------------------

    const salt = await bcrypt.genSalt(10);

    const passwordHash = await bcrypt.hash(temporaryPassword, salt);

    // --------------------------------------------------
    // 6. Create student
    // --------------------------------------------------

    const student = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "student",
      mustChangePassword: true,

      // Keep this only if your User model already has phone
      ...(phone?.trim() ? { phone: phone.trim() } : {}),
    });

    // --------------------------------------------------
    // 7. Never send password/hash back to browser
    // --------------------------------------------------

    res.status(201).json({
      success: true,
      message: "Student account created successfully.",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        mustChangePassword: student.mustChangePassword,
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create student.",
    });
  }
};

// --------------------------------------------------
// GET ALL STUDENTS
// --------------------------------------------------

export const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).sort({
      createdAt: -1,
    });

    const countsById = await loadCountsForStudents(students);

    const formatted = students.map((student) =>
      formatStudent(student, countsById.get(String(student._id))),
    );

    res.json({ success: true, students: formatted });
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch students.",
    });
  }
};

// --------------------------------------------------
// GET ONE STUDENT
// --------------------------------------------------

export const getStudentById = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.json({ success: true, student: await buildStudentResponse(student) });
  } catch (error) {
    console.error("GET STUDENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student.",
    });
  }
};

// --------------------------------------------------
// UPDATE STUDENT
// --------------------------------------------------
// Handles both editing details and reactivating a previously
// removed (isActive: false) student — the same endpoint, since
// both are just a change to the same document.

export const updateStudent = async (req, res) => {
  try {
    const { name, email, phone, isActive } = req.body;

    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      if (normalizedEmail !== student.email) {
        const existing = await User.findOne({ email: normalizedEmail });

        if (existing) {
          return res.status(409).json({
            success: false,
            message: "A user with this email already exists.",
          });
        }

        student.email = normalizedEmail;
      }
    }

    if (name !== undefined) student.name = name.trim();
    if (phone !== undefined) student.phone = phone.trim();
    if (isActive !== undefined) student.isActive = isActive;

    await student.save();

    res.json({
      success: true,
      message: "Student updated successfully.",
      student: await buildStudentResponse(student),
    });
  } catch (error) {
    console.error("UPDATE STUDENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update student.",
    });
  }
};

// --------------------------------------------------
// REMOVE (DEACTIVATE) STUDENT
// --------------------------------------------------
// Soft delete — flips isActive to false rather than deleting the document,
// consistent with how login/googleLogin/facebookLogin already check
// isActive and block sign-in for deactivated accounts. Reversible, and
// nothing that references this user's _id elsewhere (enrollments,
// submissions) goes orphaned.

export const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    student.isActive = false;
    await student.save();

    res.json({
      success: true,
      message: "Student removed.",
      id: student._id,
    });
  } catch (error) {
    console.error("DELETE STUDENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove student.",
    });
  }
};
