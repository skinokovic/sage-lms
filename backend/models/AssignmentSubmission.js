import mongoose from "mongoose";

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    // --------------------------------------------------------
    // ASSIGNMENT
    // --------------------------------------------------------

    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },

    // --------------------------------------------------------
    // STUDENT
    // --------------------------------------------------------

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // --------------------------------------------------------
    // SUBMISSION
    // --------------------------------------------------------

    content: {
      type: String,
      default: "",
      trim: true,
    },

    fileUrl: {
      type: String,
      default: "",
    },

    filePublicId: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      default: "",
    },

    // --------------------------------------------------------
    // GRADING
    // --------------------------------------------------------

    score: {
      type: Number,
      min: 0,
      default: null,
    },

    feedback: {
      type: String,
      default: "",
    },

    // Private notes — never sent to the student
    instructorNotes: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    gradedAt: {
      type: Date,
      default: null,
    },

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    status: {
      type: String,
      enum: ["Submitted", "Graded", "Late", "Returned"],
      default: "Submitted",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
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

// One student should normally have one current submission
// record per assignment.
assignmentSubmissionSchema.index(
  {
    assignment: 1,
    student: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model(
  "AssignmentSubmission",
  assignmentSubmissionSchema,
);
