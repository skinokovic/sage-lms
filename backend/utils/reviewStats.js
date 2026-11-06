import mongoose from "mongoose";
import Review from "../models/Review.js";
import Course from "../models/Course.js";
import Instructor from "../models/Instructor.js";

const round1 = (value) => Math.round(value * 10) / 10;

// Recalculates Course.rating / Course.reviewCount from published reviews.
// timestamps:false so a new review doesn't change the course's updatedAt
// (the public catalogue is sorted by it).
export const refreshCourseRating = async (courseId) => {
  const [row] = await Review.aggregate([
    {
      $match: {
        course: new mongoose.Types.ObjectId(courseId),
        status: "published",
      },
    },
    { $group: { _id: null, average: { $avg: "$courseRating" }, count: { $sum: 1 } } },
  ]);

  await Course.updateOne(
    { _id: courseId },
    { $set: { rating: round1(row?.average || 0), reviewCount: row?.count || 0 } },
    { timestamps: false },
  );
};

// Recalculates Instructor.rating / Instructor.ratingCount across ALL of the
// instructor's courses.
export const refreshInstructorRating = async (instructorUserId) => {
  const [row] = await Review.aggregate([
    {
      $match: {
        instructor: new mongoose.Types.ObjectId(instructorUserId),
        status: "published",
      },
    },
    { $group: { _id: null, average: { $avg: "$instructorRating" }, count: { $sum: 1 } } },
  ]);

  await Instructor.updateOne(
    { user: instructorUserId },
    { $set: { rating: round1(row?.average || 0), ratingCount: row?.count || 0 } },
    { timestamps: false },
  );
};
