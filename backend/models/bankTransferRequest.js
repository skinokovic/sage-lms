import mongoose from "mongoose";

const requestItemSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }, // Naira, as quoted
  },
  { _id: false },
);

// A student's claim that they paid the school by bank transfer.
// Nothing is unlocked until an admin approves it (which enrolls the student).
const bankTransferRequestSchema = new mongoose.Schema(
  {
    // Short code the student can quote to the school, e.g. BT-LK3M2Q-4F9A1C
    reference: { type: String, required: true, unique: true, index: true },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerName: { type: String, required: true, trim: true },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    customerPhone: { type: String, required: true, trim: true },

    items: {
      type: [requestItemSchema],
      validate: [(v) => v.length > 0, "A request needs at least one course."],
    },
    amountNaira: { type: Number, required: true, min: 0 },

    // What the student tells us about the transfer
    senderName: { type: String, required: true, trim: true, maxlength: 100 },
    transferReference: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    transferDate: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 500, default: "" },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    // Filled in when an admin reviews it
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, maxlength: 300, default: "" },
    adminNote: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

bankTransferRequestSchema.index({ status: 1, createdAt: -1 });
bankTransferRequestSchema.index({ user: 1, status: 1 });

export default mongoose.models.BankTransferRequest ||
  mongoose.model("BankTransferRequest", bankTransferRequestSchema);
