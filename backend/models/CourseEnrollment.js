import mongoose from "mongoose";

const courseEnrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    studentName: { type: String, trim: true },
    studentPhone: { type: String, trim: true },
    paymentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentOrder" },
    paymentReference: { type: String },
    status: {
      type: String,
      enum: ["active", "completed", "revoked"],
      default: "active",
    },
    enrolledAt: { type: Date, default: Date.now },

    // How the enrollment was paid for. Existing enrollments are Paystack
    // payments, so that is the default.
    paymentMethod: {
      type: String,
      enum: ["paystack", "bank_transfer", "cash", "complimentary", "free"],
      default: "paystack",
    },

    // Amount received (in Naira) for enrollments an admin recorded manually.
    amountPaid: { type: Number, min: 0, default: 0 },

    // Set when an admin enrolled the student (audit trail), plus an optional note.
    enrolledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    note: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

// One enrollment per student per course. This is what makes repeat
// callbacks/webhooks safe: the upsert can never create a duplicate.
courseEnrollmentSchema.index({ course: 1, studentEmail: 1 }, { unique: true });

export default mongoose.models.CourseEnrollment ||
  mongoose.model("CourseEnrollment", courseEnrollmentSchema);
