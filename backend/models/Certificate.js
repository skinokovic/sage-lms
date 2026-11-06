import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Snapshot taken when the certificate is issued
    studentName: { type: String, default: "" },
    courseTitle: { type: String, default: "" },
    instructorName: { type: String, default: "" },
    signatureUrl: { type: String, default: "" },
    totalLessons: { type: Number, default: 0 },

    issuedAt: { type: Date, default: Date.now },
    certificateUrl: { type: String, default: "" },
    certificateCode: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model("Certificate", certificateSchema);
