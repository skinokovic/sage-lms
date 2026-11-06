import mongoose from "mongoose";

const instructorApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    professionalTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    expertise: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
      max: 80,
    },

    organization: {
      type: String,
      trim: true,
      maxlength: 160,
    },

    courseCategory: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    teachingExperience: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    motivation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    linkedinUrl: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    websiteUrl: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

instructorApplicationSchema.index({ user: 1, createdAt: -1 });
instructorApplicationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model(
  "InstructorApplication",
  instructorApplicationSchema,
);
