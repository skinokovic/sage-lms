import CourseEnrollment from "../models/CourseEnrollment.js";

// Course ids (as strings) the student is actively enrolled in.
// Matches by user id OR email so guest-checkout enrollments still count.
export const getEnrolledCourseIds = async (user) => {
  const enrollments = await CourseEnrollment.find({
    status: { $ne: "revoked" },
    $or: [{ user: user._id }, { studentEmail: user.email.toLowerCase() }],
  })
    .select("course")
    .lean();

  return [...new Set(enrollments.map((item) => String(item.course)))];
};
