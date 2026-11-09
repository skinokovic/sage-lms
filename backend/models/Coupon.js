import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    // Always stored in capitals, e.g. "WELCOME20"
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    description: { type: String, trim: true, default: "", maxlength: 200 },

    // "percentage": value is 1-100.  "fixed": value is a naira amount off.
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    // Optional ceiling for a percentage coupon (e.g. 20% off, at most ₦10,000)
    maxDiscountNaira: { type: Number, default: null, min: 0 },
    // The eligible courses in the cart must add up to at least this much
    minOrderNaira: { type: Number, default: 0, min: 0 },

    // "all" = any course; "courses" = only the courses listed below
    appliesTo: { type: String, enum: ["all", "courses"], default: "all" },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],

    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },

    // Total redemptions across everyone (null = unlimited)
    usageLimit: { type: Number, default: null, min: 1 },
    // Redemptions allowed per student
    perUserLimit: { type: Number, default: 1, min: 1 },

    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
