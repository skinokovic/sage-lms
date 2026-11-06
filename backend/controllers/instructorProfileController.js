import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Instructor from "../models/Instructor.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Assignment from "../models/Assignment.js";
import Progress from "../models/Progress.js";
import cloudinary from "../utils/cloudinary.js";

const COUNTED_ENROLLMENT_STATUSES = ["active", "completed"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value, max) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

const buildProfile = (user, instructor) => ({
  name: user.name || "",
  email: user.email || "",
  phone: user.phone || "",
  avatarUrl: user.avatarUrl || "",
  location: instructor?.location || "",
  specialization: instructor?.specialization || "",
  experience: instructor?.experience || "",
  qualification: instructor?.qualification || "",
  bio: instructor?.bio || "",
  status: instructor?.status || "Active",
});

// GET /api/instructor/profile
export const getMyProfile = asyncHandler(async (req, res) => {
  const [user, instructor, courses] = await Promise.all([
    User.findById(req.user._id).select("name email phone avatarUrl").lean(),
    Instructor.findOne({ user: req.user._id }).lean(),
    Course.find({ instructor: req.user._id })
      .select("title status rating updatedAt modules.lessons._id")
      .sort({ updatedAt: -1 })
      .lean(),
  ]);

  const courseIds = courses.map((course) => course._id);

  const [enrollmentCounts, uniqueStudents, progressCounts, assignments] =
    await Promise.all([
      CourseEnrollment.aggregate([
        {
          $match: {
            course: { $in: courseIds },
            status: { $in: COUNTED_ENROLLMENT_STATUSES },
          },
        },
        { $group: { _id: "$course", students: { $sum: 1 } } },
      ]),
      CourseEnrollment.distinct("studentEmail", {
        course: { $in: courseIds },
        status: { $in: COUNTED_ENROLLMENT_STATUSES },
      }),
      Progress.aggregate([
        { $match: { courseId: { $in: courseIds }, completed: true } },
        { $group: { _id: "$courseId", done: { $sum: 1 } } },
      ]),
      Assignment.countDocuments({ instructor: req.user._id }),
    ]);

  const studentsByCourse = new Map(
    enrollmentCounts.map((row) => [String(row._id), row.students]),
  );
  const doneByCourse = new Map(
    progressCounts.map((row) => [String(row._id), row.done]),
  );

  const rows = courses.map((course) => {
    const key = String(course._id);
    const students = studentsByCourse.get(key) || 0;
    const lessons = (course.modules || []).reduce(
      (total, courseModule) => total + (courseModule.lessons || []).length,
      0,
    );
    const possible = students * lessons;
    const completion =
      possible > 0
        ? Math.min(
            100,
            Math.round(((doneByCourse.get(key) || 0) / possible) * 100),
          )
        : 0;

    return {
      id: key,
      title: course.title,
      students,
      completion,
      rating: course.rating || 0,
      status: course.status,
    };
  });

  const rated = courses.filter((course) => course.rating > 0);
  const averageRating = rated.length
    ? Math.round(
        (rated.reduce((total, course) => total + course.rating, 0) /
          rated.length) *
          10,
      ) / 10
    : null;

  res.json({
    success: true,
    profile: buildProfile(user, instructor),
    stats: {
      courses: courses.length,
      students: uniqueStudents.length,
      assignments,
      rating: averageRating,
    },
    courses: rows.slice(0, 4),
    totalCourses: courses.length,
  });
});

// PATCH /api/instructor/profile
export const updateMyProfile = asyncHandler(async (req, res) => {
  const name = clean(req.body.name, 100);
  const email = clean(req.body.email, 150).toLowerCase();

  if (!name) {
    res.status(400);
    throw new Error("Name is required");
  }

  if (!EMAIL_PATTERN.test(email)) {
    res.status(400);
    throw new Error("A valid email address is required");
  }

  const taken = await User.exists({ email, _id: { $ne: req.user._id } });
  if (taken) {
    res.status(409);
    throw new Error("That email address is already in use");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name, email, phone: clean(req.body.phone, 30) } },
    { new: true, runValidators: true },
  )
    .select("name email phone avatarUrl")
    .lean();

  const instructor = await Instructor.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        location: clean(req.body.location, 120),
        specialization: clean(req.body.specialization, 150),
        experience: clean(req.body.experience, 50),
        qualification: clean(req.body.qualification, 150),
        bio: clean(req.body.bio, 1000),
      },
      $setOnInsert: { status: "Active" },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  res.json({
    success: true,
    message: "Profile updated successfully",
    profile: buildProfile(user, instructor),
  });
});

// PATCH /api/instructor/profile/avatar  (multipart, field "avatar")
export const updateMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image was uploaded");
  }

  const previous = await User.findById(req.user._id).select("avatarUrl").lean();

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatarUrl: req.file.path } },
    { new: true },
  )
    .select("avatarUrl")
    .lean();

  // Remove the old photo, but only if it is one of ours
  const match = previous?.avatarUrl?.match(
    /\/upload\/(?:v\d+\/)?(sage-lms\/avatars\/[^.]+)\.[a-z0-9]+$/i,
  );
  if (match) cloudinary.uploader.destroy(match[1]).catch(() => {});

  res.json({
    success: true,
    message: "Profile photo updated",
    avatarUrl: user.avatarUrl,
  });
});
