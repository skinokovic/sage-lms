import mongoose from "mongoose";

const isRating = {
  validator: Number.isInteger,
  message: "Ratings must be whole numbers from 1 to 5.",
};

const reviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // The course's instructor (a User id) when the review was written
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    courseRating: { type: Number, required: true, min: 1, max: 5, validate: isRating },
    courseComment: { type: String, trim: true, default: "", maxlength: 1000 },

    instructorRating: { type: Number, required: true, min: 1, max: 5, validate: isRating },
    instructorComment: { type: String, trim: true, default: "", maxlength: 1000 },

    // Admins can hide a review without deleting it
    status: {
      type: String,
      enum: ["published", "hidden"],
      default: "published",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// One review per student per course
reviewSchema.index({ course: 1, student: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
