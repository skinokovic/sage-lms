import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "global",
      unique: true,
      index: true,
    },

    // ---------------------------------------------------------
    // GENERAL
    // ---------------------------------------------------------
    platformName: {
      type: String,
      default: "SAGE LMS",
      trim: true,
    },

    platformEmail: {
      type: String,
      default: "admin@sagelms.com",
      trim: true,
      lowercase: true,
    },

    supportEmail: {
      type: String,
      default: "support@sagelms.com",
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: "+234 800 000 0000",
      trim: true,
    },

    description: {
      type: String,
      default:
        "A modern learning management platform for students, instructors, and administrators.",
      trim: true,
    },

    // ---------------------------------------------------------
    // LOCALIZATION
    // ---------------------------------------------------------
    language: {
      type: String,
      default: "English",
      enum: ["English", "French", "Spanish"],
    },

    timezone: {
      type: String,
      default: "Africa/Lagos",
      enum: ["Africa/Lagos", "UTC", "Europe/London", "America/New_York"],
    },

    currency: {
      type: String,
      default: "NGN (₦)",
      enum: ["NGN (₦)", "USD ($)", "GBP (£)", "EUR (€)"],
    },

    // ---------------------------------------------------------
    // NOTIFICATIONS
    // ---------------------------------------------------------
    emailNotifications: {
      type: Boolean,
      default: true,
    },

    assignmentNotifications: {
      type: Boolean,
      default: true,
    },

    enrollmentNotifications: {
      type: Boolean,
      default: true,
    },

    certificateNotifications: {
      type: Boolean,
      default: true,
    },

    marketingNotifications: {
      type: Boolean,
      default: false,
    },

    // ---------------------------------------------------------
    // LEARNING
    // ---------------------------------------------------------
    allowStudentRegistration: {
      type: Boolean,
      default: true,
    },

    requireEmailVerification: {
      type: Boolean,
      default: true,
    },

    allowInstructorRegistration: {
      type: Boolean,
      default: false,
    },

    courseApprovalRequired: {
      type: Boolean,
      default: true,
    },

    assignmentApprovalRequired: {
      type: Boolean,
      default: false,
    },

    certificateAutoIssue: {
      type: Boolean,
      default: true,
    },

    // ---------------------------------------------------------
    // SECURITY
    // ---------------------------------------------------------
    twoFactorAuthentication: {
      type: Boolean,
      default: false,
    },

    sessionTimeout: {
      type: String,
      default: "30 minutes",
      enum: ["15 minutes", "30 minutes", "1 hour", "2 hours", "4 hours"],
    },

    passwordExpiry: {
      type: String,
      default: "90 days",
      enum: ["30 days", "60 days", "90 days", "180 days", "Never"],
    },

    // ---------------------------------------------------------
    // PAYMENTS
    // ---------------------------------------------------------
    paymentGateway: {
      type: String,
      default: "Paystack",
      enum: ["Paystack", "Flutterwave", "Stripe"],
    },

    paymentMode: {
      type: String,
      default: "Test Mode",
      enum: ["Test Mode", "Live Mode"],
    },

    defaultCoursePrice: {
      type: Number,
      default: 50000,
      min: 0,
    },

    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ---------------------------------------------------------
    // AUDIT
    // ---------------------------------------------------------
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
