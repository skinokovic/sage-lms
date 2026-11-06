import mongoose from "mongoose";

/**
 * Every schema below uses this so API responses expose `id` instead of
 * Mongo's `_id`, matching what your existing frontend already expects
 * (course.id, module.id, lesson.id) — minimizing frontend rewrite surface.
 */
const stripMongoIds = (_doc, ret) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

const subdocOptions = {
  toJSON: { transform: stripMongoIds },
  toObject: { transform: stripMongoIds },
};

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, default: "Document" },
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  subdocOptions,
);

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "Video",
        "Text",
        "Document",
        "External Link",
        "Quiz",
        "Assignment",
      ],
      default: "Video",
    },
    duration: { type: String, default: "" },
    description: { type: String, default: "" },
    // Video URL (uploaded or pasted), text body, or external link — same
    // field your frontend already uses for all of these.
    content: { type: String, default: "" },
    videoPublicId: { type: String, default: "" },
    isPreview: { type: Boolean, default: false },
    resources: [resourceSchema],
  },
  subdocOptions,
);

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    lessons: [lessonSchema],
  },
  subdocOptions,
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // Short summary shown on course cards. Older courses won't have one.
    shortDescription: { type: String, default: "", trim: true, maxlength: 500 },
    description: { type: String, required: true },
    objectives: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    category: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "Beginner",
    },
    duration: { type: String, default: "" },
    language: { type: String, default: "English" },
    price: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Draft",
    },
    thumbnail: { type: String, default: "" },
    thumbnailPublicId: { type: String, default: "" },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Not yet computed from real enrollment/review systems — defaults to 0
    // for every new course rather than showing invented numbers. Wire these
    // up to real aggregates once Enrollment/Review models exist.
    students: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    modules: [moduleSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: stripMongoIds },
    toObject: { virtuals: true, transform: stripMongoIds },
  },
);

courseSchema.virtual("lessonCount").get(function () {
  const modules = this.modules || [];

  return modules.reduce(
    (total, courseModule) => total + (courseModule.lessons || []).length,
    0,
  );
});

courseSchema.index({ title: "text", category: "text" });

export default mongoose.model("Course", courseSchema);
