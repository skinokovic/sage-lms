import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    // ----------------------------------------------------------
    // BASIC INFORMATION
    // ----------------------------------------------------------

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    instructions: {
      type: String,
      default: "",
      trim: true,
    },

    // ----------------------------------------------------------
    // COURSE
    // ----------------------------------------------------------

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    // ----------------------------------------------------------
    // INSTRUCTOR
    // ----------------------------------------------------------

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ----------------------------------------------------------
    // ASSIGNMENT TYPE
    // ----------------------------------------------------------

    type: {
      type: String,
      enum: ["Assignment", "Practical", "Project", "Quiz", "Case Study"],
      default: "Assignment",
    },

    submissionType: {
      type: String,
      enum: ["File Upload", "Text Submission", "Both"],
      default: "File Upload",
    },

    /*
     * Date the assignment was published
     */
    publishedAt: {
      type: Date,
      default: null,
    },

    /*
     * Whether a file must be attached.
     *
     * Useful when submissionType is File Upload or Both.
     */
    attachmentRequired: {
      type: Boolean,
      default: false,
    },

    // ----------------------------------------------------------
    // MARKS
    // ----------------------------------------------------------

    points: {
      type: Number,
      required: true,
      min: 0,
      default: 100,
    },

    passingScore: {
      type: Number,
      min: 0,
      default: 50,
    },

    // ----------------------------------------------------------
    // DATES
    // ----------------------------------------------------------

    dueDate: {
      type: Date,
      default: null,
    },

    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    status: {
      type: String,
      enum: ["Draft", "Published", "Closed"],
      default: "Draft",
    },

    // ----------------------------------------------------------
    // ATTACHMENTS / RESOURCES
    // ----------------------------------------------------------

    resources: [
      {
        name: {
          type: String,
          trim: true,
        },

        type: {
          type: String,
          default: "Document",
        },

        url: {
          type: String,
          default: "",
        },

        publicId: {
          type: String,
          default: "",
        },
      },
    ],

    // ----------------------------------------------------------
    // SETTINGS
    // ----------------------------------------------------------

    allowLateSubmission: {
      type: Boolean,
      default: true,
    },

    maxAttempts: {
      type: Number,
      min: 1,
      default: 1,
    },

    // ----------------------------------------------------------
    // OPTIONAL COURSE LESSON LINK
    //
    // This allows an assignment to optionally be associated
    // with a particular lesson inside Course.modules[].lessons[].
    // ----------------------------------------------------------

    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;

        return ret;
      },
    },

    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;

        return ret;
      },
    },
  },
);

// Useful indexes
assignmentSchema.index({
  title: "text",
  description: "text",
});

assignmentSchema.index({
  course: 1,
  status: 1,
});

assignmentSchema.index({
  instructor: 1,
  createdAt: -1,
});

export default mongoose.model("Assignment", assignmentSchema);
