import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    type: {
      type: String,
      enum: ["Live Class", "Practical", "Office Hours", "Seminar", "Review"],
      default: "Live Class",
    },
    mode: {
      type: String,
      enum: ["Online", "Physical"],
      default: "Online",
    },
    location: { type: String, trim: true, maxlength: 150, default: "" },
    meetingLink: { type: String, trim: true, maxlength: 500, default: "" },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Scheduled", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true },
);

scheduleSchema.index({ course: 1, startsAt: 1 });

export default mongoose.model("Schedule", scheduleSchema);
