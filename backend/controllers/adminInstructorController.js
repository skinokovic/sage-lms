import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Instructor from "../models/Instructor.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";

/* ============================================================
   HELPER
============================================================ */

const formatInstructor = (user, instructor = null, stats = {}) => {
  const status = instructor?.status || (user.isActive ? "Active" : "Inactive");

  return {
    id: instructor?._id || user._id,
    userId: user._id,

    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    avatarUrl: user.avatarUrl || "",

    status,

    // Use live database aggregates
    courses: stats.totalCourses ?? 0,
    students: stats.totalStudents ?? 0,

    rating: instructor?.rating || 0,

    specialization: instructor?.specialization || "",
    experience: instructor?.experience || "",
    bio: instructor?.bio || "",

    joined: instructor?.joinedAt || user.createdAt,
  };
};

// ============================================================
// CALCULATE LIVE INSTRUCTOR STATISTICS
// ============================================================

const getInstructorStats = async (userIds) => {
  const statsMap = new Map();

  if (!userIds.length) {
    return statsMap;
  }

  // Count courses owned by each instructor's USER ID
  const courseStats = await Course.aggregate([
    {
      $match: {
        instructor: { $in: userIds },
      },
    },
    {
      $group: {
        _id: "$instructor",
        totalCourses: { $sum: 1 },
      },
    },
  ]);

  courseStats.forEach((item) => {
    statsMap.set(item._id.toString(), {
      totalCourses: item.totalCourses,
      totalStudents: 0,
    });
  });

  // Count distinct enrolled students across each instructor's courses.
  // Active and completed enrollments count; revoked enrollments do not.
  const studentStats = await CourseEnrollment.aggregate([
    {
      $match: {
        status: { $in: ["active", "completed"] },
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "courseData",
      },
    },
    {
      $unwind: "$courseData",
    },
    {
      $match: {
        "courseData.instructor": { $in: userIds },
      },
    },
    {
      // One student is counted only once per instructor,
      // even if enrolled in multiple courses.
      $group: {
        _id: {
          instructor: "$courseData.instructor",
          studentEmail: "$studentEmail",
        },
      },
    },
    {
      $group: {
        _id: "$_id.instructor",
        totalStudents: { $sum: 1 },
      },
    },
  ]);

  studentStats.forEach((item) => {
    const key = item._id.toString();

    const current = statsMap.get(key) || {
      totalCourses: 0,
      totalStudents: 0,
    };

    current.totalStudents = item.totalStudents;

    statsMap.set(key, current);
  });

  return statsMap;
};

/* ============================================================
   GET ALL INSTRUCTORS
   IMPORTANT:
   We start from User because every instructor must have
   role === "instructor".
============================================================ */

// export const getInstructors = asyncHandler(async (req, res) => {
//   // Get ALL instructor user accounts
//   const users = await User.find({
//     role: "instructor",
//   })
//     .select("name email phone avatarUrl isActive createdAt")
//     .sort({ createdAt: -1 })
//     .lean();

//   // Get instructor profiles belonging to those users
//   const userIds = users.map((user) => user._id);

//   const instructorProfiles = await Instructor.find({
//     user: { $in: userIds },
//   }).lean();

//   // Make a quick lookup by user ID
//   const profileMap = new Map();

//   instructorProfiles.forEach((profile) => {
//     profileMap.set(profile.user.toString(), profile);
//   });

//   // Combine User + Instructor profile
//   const formattedInstructors = users.map((user) => {
//     const profile = profileMap.get(user._id.toString());

//     return formatInstructor(user, profile);
//   });

//   res.status(200).json({
//     success: true,
//     count: formattedInstructors.length,
//     data: formattedInstructors,
//   });
// });

export const getInstructors = asyncHandler(async (req, res) => {
  // Get all instructor user accounts
  const users = await User.find({
    role: "instructor",
  })
    .select("name email phone avatarUrl isActive createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const userIds = users.map((user) => user._id);

  // Get instructor profiles
  const instructorProfiles = await Instructor.find({
    user: { $in: userIds },
  }).lean();

  // Map profiles by USER ID
  const profileMap = new Map();

  instructorProfiles.forEach((profile) => {
    profileMap.set(profile.user.toString(), profile);
  });

  // Calculate live course and student statistics
  const statsMap = await getInstructorStats(userIds);

  // Combine User + Instructor profile + live statistics
  const formattedInstructors = users.map((user) => {
    const key = user._id.toString();

    const profile = profileMap.get(key);
    const stats = statsMap.get(key) || {
      totalCourses: 0,
      totalStudents: 0,
    };

    return formatInstructor(user, profile, stats);
  });

  res.status(200).json({
    success: true,
    count: formattedInstructors.length,
    data: formattedInstructors,
  });
});

/* ============================================================
   GET ONE INSTRUCTOR
============================================================ */

export const getInstructor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let user = null;
  let instructor = null;

  // ----------------------------------------------------------
  // 1. Try the ID as a User ID
  // ----------------------------------------------------------

  user = await User.findById(id)
    .select("name email phone avatarUrl isActive createdAt role")
    .lean();

  if (user && user.role === "instructor") {
    instructor = await Instructor.findOne({
      user: user._id,
    }).lean();
  }

  // ----------------------------------------------------------
  // 2. If not found, try the ID as an Instructor ID
  // ----------------------------------------------------------

  if (!user) {
    instructor = await Instructor.findById(id).lean();

    if (instructor) {
      user = await User.findById(instructor.user)
        .select("name email phone avatarUrl isActive createdAt role")
        .lean();
    }
  }

  // ----------------------------------------------------------
  // 3. Validate
  // ----------------------------------------------------------

  if (!user || user.role !== "instructor") {
    res.status(404);
    throw new Error("Instructor not found");
  }

  // ----------------------------------------------------------
  // 4. Return combined instructor data
  // ----------------------------------------------------------

  // Calculate live statistics using the instructor USER ID
  const statsMap = await getInstructorStats([user._id]);

  const stats = statsMap.get(user._id.toString()) || {
    totalCourses: 0,
    totalStudents: 0,
  };

  res.status(200).json({
    success: true,
    data: formatInstructor(user, instructor, stats),
  });
});

/* ============================================================
   CREATE INSTRUCTOR
============================================================ */

export const createInstructor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    specialization,
    experience,
    bio,
    status,
  } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error("Name and email are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const temporaryPassword =
    password || `Sage@${Math.random().toString(36).slice(-8)}`;

  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone || "",
    passwordHash,
    role: "instructor",

    isActive: status !== "Inactive",

    mustChangePassword: true,
  });

  try {
    const instructor = await Instructor.create({
      user: user._id,

      specialization: specialization || "",

      experience: experience || "",

      bio: bio || "",

      status: status || "Pending",

      rating: 0,
      totalStudents: 0,
      totalCourses: 0,
    });

    res.status(201).json({
      success: true,
      message: "Instructor created successfully",

      data: {
        ...formatInstructor(user, instructor),

        temporaryPassword,
      },
    });
  } catch (error) {
    // Roll back User if Instructor creation fails
    await User.findByIdAndDelete(user._id);

    throw error;
  }
});

/* ============================================================
   UPDATE INSTRUCTOR
============================================================ */

export const updateInstructor = asyncHandler(async (req, res) => {
  const instructorId = req.params.id;

  let instructor = await Instructor.findById(instructorId);

  let user;

  // ------------------------------------------
  // If ID belongs to Instructor
  // ------------------------------------------

  if (instructor) {
    user = await User.findById(instructor.user);
  }

  // ------------------------------------------
  // Otherwise ID may be User ID
  // ------------------------------------------

  if (!user) {
    user = await User.findById(instructorId);

    if (user) {
      instructor = await Instructor.findOne({
        user: user._id,
      });
    }
  }

  if (!user || user.role !== "instructor") {
    res.status(404);
    throw new Error("Instructor not found");
  }

  // ------------------------------------------
  // Create missing instructor profile
  // ------------------------------------------

  if (!instructor) {
    instructor = await Instructor.create({
      user: user._id,
      specialization: "",
      experience: "",
      bio: "",
      status: user.isActive ? "Active" : "Inactive",
      rating: 0,
      totalStudents: 0,
      totalCourses: 0,
    });
  }

  const {
    name,
    email,
    phone,
    specialization,
    experience,
    bio,
    rating,
    status,
  } = req.body;

  // ------------------------------------------
  // USER INFORMATION
  // ------------------------------------------

  if (name !== undefined) {
    user.name = name.trim();
  }

  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingEmail = await User.findOne({
      email: normalizedEmail,
      _id: {
        $ne: user._id,
      },
    });

    if (existingEmail) {
      res.status(400);
      throw new Error("Another user already uses this email");
    }

    user.email = normalizedEmail;
  }

  if (phone !== undefined) {
    user.phone = phone;
  }

  // ------------------------------------------
  // INSTRUCTOR INFORMATION
  // ------------------------------------------

  if (specialization !== undefined) {
    instructor.specialization = specialization;
  }

  if (experience !== undefined) {
    instructor.experience = experience;
  }

  if (bio !== undefined) {
    instructor.bio = bio;
  }

  if (rating !== undefined) {
    const numericRating = Number(rating);

    if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
      res.status(400);
      throw new Error("Rating must be between 0 and 5");
    }

    instructor.rating = numericRating;
  }

  if (status !== undefined) {
    if (!["Active", "Pending", "Inactive"].includes(status)) {
      res.status(400);
      throw new Error("Invalid instructor status");
    }

    instructor.status = status;

    user.isActive = status !== "Inactive";
  }

  await user.save();
  await instructor.save();

  const updatedUser = await User.findById(user._id)
    .select("name email phone avatarUrl isActive createdAt")
    .lean();

  const updatedInstructor = await Instructor.findById(instructor._id).lean();

  res.status(200).json({
    success: true,
    message: "Instructor updated successfully",

    data: formatInstructor(updatedUser, updatedInstructor),
  });
});

/* ============================================================
   DELETE INSTRUCTOR
============================================================ */

export const deleteInstructor = asyncHandler(async (req, res) => {
  const instructorId = req.params.id;

  let instructor = await Instructor.findById(instructorId);

  let user;

  if (instructor) {
    user = await User.findById(instructor.user);
  } else {
    user = await User.findById(instructorId);

    if (user) {
      instructor = await Instructor.findOne({
        user: user._id,
      });
    }
  }

  if (!user || user.role !== "instructor") {
    res.status(404);
    throw new Error("Instructor not found");
  }

  // Remove instructor profile if it exists
  if (instructor) {
    await Instructor.findByIdAndDelete(instructor._id);
  }

  // Remove instructor account
  await User.findByIdAndDelete(user._id);

  res.status(200).json({
    success: true,
    message: "Instructor removed successfully",
  });
});

/* ============================================================
   UPDATE STATUS
============================================================ */

export const updateInstructorStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["Active", "Pending", "Inactive"].includes(status)) {
    res.status(400);
    throw new Error("Invalid instructor status");
  }

  const instructorId = req.params.id;

  let instructor = await Instructor.findById(instructorId);

  let user;

  if (instructor) {
    user = await User.findById(instructor.user);
  } else {
    user = await User.findById(instructorId);

    if (user) {
      instructor = await Instructor.findOne({
        user: user._id,
      });
    }
  }

  if (!user || user.role !== "instructor") {
    res.status(404);
    throw new Error("Instructor not found");
  }

  // Create profile if an existing instructor
  // user does not yet have one.
  if (!instructor) {
    instructor = await Instructor.create({
      user: user._id,
      specialization: "",
      experience: "",
      bio: "",
      status,
      rating: 0,
      totalStudents: 0,
      totalCourses: 0,
    });
  }

  instructor.status = status;

  user.isActive = status !== "Inactive";

  await instructor.save();
  await user.save();

  res.status(200).json({
    success: true,
    message: `Instructor status changed to ${status}`,

    data: {
      id: instructor._id,
      userId: user._id,
      status: instructor.status,
      isActive: user.isActive,
    },
  });
});
