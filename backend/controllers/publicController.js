import asyncHandler from "express-async-handler";
import Instructor from "../models/Instructor.js";
import Course from "../models/Course.js";

// @desc    Public instructor profiles for the "Our Instructors" page
// @route   GET /api/public/instructors
// @access  Public
//
// Only safe, display-ready fields are returned: no email, phone or ids of
// the underlying user account.
const getPublicInstructors = asyncHandler(async (req, res) => {
  const profiles = await Instructor.find({ status: "Active" })
    .populate({
      path: "user",
      select: "name avatarUrl",
      match: { isActive: { $ne: false } },
    })
    .sort({ joinedAt: 1 })
    .lean();

  // populate() sets user to null when the account is inactive/missing
  const visible = profiles.filter((profile) => profile.user);

  const counts = await Course.aggregate([
    {
      $match: {
        instructor: { $in: visible.map((profile) => profile.user._id) },
        status: "Published",
      },
    },
    { $group: { _id: "$instructor", courses: { $sum: 1 } } },
  ]);

  const coursesByInstructor = new Map(
    counts.map((row) => [String(row._id), row.courses]),
  );

  const instructors = visible.map((profile) => ({
    id: String(profile._id),
    name: profile.user.name,
    avatarUrl: profile.user.avatarUrl || "",
    specialization: profile.specialization || "",
    experience: profile.experience || "",
    qualification: profile.qualification || "",
    location: profile.location || "",
    bio: profile.bio || "",
    rating: profile.rating || 0,
    reviews: profile.ratingCount || 0,
    courses: coursesByInstructor.get(String(profile.user._id)) || 0,
  }));

  res.set("Cache-Control", "public, max-age=60");
  res.json({ success: true, count: instructors.length, instructors });
});

export { getPublicInstructors };
