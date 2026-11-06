import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Certificate from "../models/Certificate.js";
import Progress from "../models/Progress.js";
import cloudinary from "../utils/cloudinary.js";
import { getEnrolledCourseIds } from "../utils/studentEnrollments.js";
import { issueCertificatesForStudent } from "../utils/issueCertificates.js";

const clean = (value, max) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

// Lesson durations are free text ("15 min", "1h 30m", "1 hour", "12:30")
const parseMinutes = (value) => {
  const text = String(value || "")
    .toLowerCase()
    .trim();
  if (!text) return 0;

  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/);
  const mins = text.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/);

  if (hours || mins) {
    return Math.round(
      (hours ? parseFloat(hours[1]) * 60 : 0) +
        (mins ? parseFloat(mins[1]) : 0),
    );
  }

  const clock = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (clock) {
    return clock[3]
      ? Math.round(
          Number(clock[1]) * 60 + Number(clock[2]) + Number(clock[3]) / 60,
        )
      : Math.round(Number(clock[1]) + Number(clock[2]) / 60); // mm:ss
  }

  return /^\d+(\.\d+)?$/.test(text) ? Math.round(parseFloat(text)) : 0;
};

const buildProfile = (user) => ({
  name: user.name || "",
  email: user.email || "",
  phone: user.phone || "",
  location: user.location || "",
  avatarUrl: user.avatarUrl || "",
  role: user.role || "student",
});

// GET /api/student/profile
export const getMyProfile = asyncHandler(async (req, res) => {
  // Make sure certificates for finished courses exist before counting them
  await issueCertificatesForStudent(req.user);

  const [user, courseIds, certificates] = await Promise.all([
    User.findById(req.user._id)
      .select("name email phone location avatarUrl role")
      .lean(),
    getEnrolledCourseIds(req.user),
    Certificate.countDocuments({ userId: req.user._id }),
  ]);

  const [courses, doneRows] = courseIds.length
    ? await Promise.all([
        Course.find({ _id: { $in: courseIds } })
          .select("modules.lessons._id modules.lessons.duration")
          .lean(),
        Progress.find({
          userId: req.user._id,
          courseId: { $in: courseIds },
          completed: true,
        })
          .select("courseId lessonId")
          .lean(),
      ])
    : [[], []];

  const doneByCourse = new Map();
  doneRows.forEach((row) => {
    const key = String(row.courseId);
    const set = doneByCourse.get(key) || new Set();
    set.add(String(row.lessonId));
    doneByCourse.set(key, set);
  });

  let completed = 0;
  let learningMinutes = 0;

  courses.forEach((course) => {
    const lessons = (course.modules || []).flatMap(
      (courseModule) => courseModule.lessons || [],
    );
    const done = doneByCourse.get(String(course._id)) || new Set();

    let finished = 0;
    lessons.forEach((lesson) => {
      if (done.has(String(lesson._id))) {
        finished += 1;
        learningMinutes += parseMinutes(lesson.duration);
      }
    });

    if (lessons.length > 0 && finished === lessons.length) completed += 1;
  });

  res.json({
    success: true,
    profile: buildProfile(user),
    stats: {
      enrolled: courses.length,
      completed,
      certificates,
      learningMinutes,
    },
  });
});

// PATCH /api/student/profile
export const updateMyProfile = asyncHandler(async (req, res) => {
  const name = clean(req.body.name, 100);

  if (!name) {
    res.status(400);
    throw new Error("Name is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        name,
        phone: clean(req.body.phone, 30),
        // strict:false below lets this save even if your User schema has no
        // `location` field yet
        location: clean(req.body.location, 120),
      },
    },
    { new: true, strict: false, runValidators: true },
  )
    .select("name email phone location avatarUrl role")
    .lean();

  res.json({
    success: true,
    message: "Profile updated successfully",
    profile: buildProfile(user),
  });
});

// PATCH /api/student/profile/avatar  (multipart, field "avatar")
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
