import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Schedule from "../models/Schedule.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";

const TYPES = ["Live Class", "Practical", "Office Hours", "Seminar", "Review"];
const MODES = ["Online", "Physical"];
const COUNTED_ENROLLMENT_STATUSES = ["active", "completed"];

const clean = (value, max) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

// What the page shows: Upcoming / In Progress / Completed / Cancelled
const getScheduleStatus = (schedule, now = Date.now()) => {
  if (schedule.status === "Cancelled") return "Cancelled";
  if (new Date(schedule.endsAt).getTime() < now) return "Completed";
  if (new Date(schedule.startsAt).getTime() <= now) return "In Progress";
  return "Upcoming";
};

const readFields = (body, res) => {
  const fail = (message) => {
    res.status(400);
    throw new Error(message);
  };

  const title = clean(body.title, 150);
  if (!title) fail("Title is required");
  if (!mongoose.isValidObjectId(body.course)) fail("Please choose a course");
  if (!TYPES.includes(body.type)) fail("Please choose a session type");
  if (!MODES.includes(body.mode)) fail("Please choose a delivery mode");

  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    fail("A valid date and time is required");
  }
  if (endsAt <= startsAt) fail("The end time must be after the start time");

  let location = clean(body.location, 150);
  let meetingLink = clean(body.meetingLink, 500);

  if (body.mode === "Online") {
    if (!/^https?:\/\/\S+$/i.test(meetingLink)) {
      fail("Please provide a valid meeting link (http:// or https://)");
    }
    location = location || "Virtual Classroom";
  } else {
    meetingLink = "";
    if (!location) fail("Please provide the venue for a physical session");
  }

  return {
    title,
    course: body.course,
    type: body.type,
    mode: body.mode,
    location,
    meetingLink,
    startsAt,
    endsAt,
    description: clean(body.description, 1000),
  };
};

const ensureOwnCourse = async (courseId, user, res) => {
  const course = await Course.findOne({ _id: courseId, instructor: user._id })
    .select("_id")
    .lean();

  if (!course) {
    res.status(403);
    throw new Error("You can only schedule sessions for your own courses");
  }
};

const studentCounts = async (courseIds) => {
  if (courseIds.length === 0) return new Map();

  const rows = await CourseEnrollment.aggregate([
    {
      $match: {
        course: { $in: courseIds },
        status: { $in: COUNTED_ENROLLMENT_STATUSES },
      },
    },
    { $group: { _id: "$course", students: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.students]));
};

const formatSchedule = (schedule, students = 0) => ({
  id: String(schedule._id),
  title: schedule.title,
  description: schedule.description || "",
  courseId: String(schedule.course?._id || schedule.course),
  course: schedule.course?.title || "Course",
  type: schedule.type,
  mode: schedule.mode,
  location: schedule.location || "",
  meetingLink: schedule.meetingLink || "",
  startsAt: schedule.startsAt,
  endsAt: schedule.endsAt,
  students,
  status: getScheduleStatus(schedule),
  cancelled: schedule.status === "Cancelled",
});

const findOwned = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404);
    throw new Error("Schedule not found");
  }

  const schedule = await Schedule.findOne({
    _id: req.params.id,
    instructor: req.user._id,
  });

  if (!schedule) {
    res.status(404);
    throw new Error("Schedule not found");
  }

  return schedule;
};

// GET /api/instructor/schedules
export const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await Schedule.find({ instructor: req.user._id })
    .populate("course", "title")
    .lean();

  const courseIds = [
    ...new Map(
      schedules
        .filter((item) => item.course)
        .map((item) => [String(item.course._id), item.course._id]),
    ).values(),
  ];

  const counts = await studentCounts(courseIds);

  const items = schedules.map((item) =>
    formatSchedule(item, counts.get(String(item.course?._id)) || 0),
  );

  // Running and upcoming first (soonest first), then past/cancelled (latest first)
  const rank = (item) =>
    item.status === "In Progress" ? 0 : item.status === "Upcoming" ? 1 : 2;

  items.sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (rank(a) < 2
        ? new Date(a.startsAt) - new Date(b.startsAt)
        : new Date(b.startsAt) - new Date(a.startsAt)),
  );

  res.json({ success: true, schedules: items });
});

// GET /api/instructor/schedules/:id
export const getSchedule = asyncHandler(async (req, res) => {
  const schedule = await findOwned(req, res);
  await schedule.populate("course", "title");

  const counts = await studentCounts([schedule.course._id]);

  res.json({
    success: true,
    schedule: formatSchedule(
      schedule.toObject(),
      counts.get(String(schedule.course._id)) || 0,
    ),
  });
});

// POST /api/instructor/schedules
export const createSchedule = asyncHandler(async (req, res) => {
  const fields = readFields(req.body, res);
  await ensureOwnCourse(fields.course, req.user, res);

  const schedule = await Schedule.create({
    ...fields,
    instructor: req.user._id,
  });

  await schedule.populate("course", "title");

  res.status(201).json({
    success: true,
    message: "Schedule created successfully",
    schedule: formatSchedule(schedule.toObject()),
  });
});

// PATCH /api/instructor/schedules/:id
export const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await findOwned(req, res);

  const fields = readFields(req.body, res);
  await ensureOwnCourse(fields.course, req.user, res);

  Object.assign(schedule, fields);

  if (typeof req.body.cancelled === "boolean") {
    schedule.status = req.body.cancelled ? "Cancelled" : "Scheduled";
  }

  await schedule.save();
  await schedule.populate("course", "title");

  res.json({
    success: true,
    message: "Schedule updated successfully",
    schedule: formatSchedule(schedule.toObject()),
  });
});

// DELETE /api/instructor/schedules/:id
export const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await findOwned(req, res);
  await schedule.deleteOne();

  res.json({ success: true, message: "Schedule removed successfully" });
});
