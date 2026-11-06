import Settings from "../models/Settings.js";

// ---------------------------------------------------------
// DEFAULT SETTINGS
// ---------------------------------------------------------
const DEFAULT_SETTINGS = {
  platformName: "SAGE LMS",
  platformEmail: "admin@sagelms.com",
  supportEmail: "support@sagelms.com",
  phone: "+234 800 000 0000",
  description:
    "A modern learning management platform for students, instructors, and administrators.",

  language: "English",
  timezone: "Africa/Lagos",
  currency: "NGN (₦)",

  emailNotifications: true,
  assignmentNotifications: true,
  enrollmentNotifications: true,
  certificateNotifications: true,
  marketingNotifications: false,

  allowStudentRegistration: true,
  requireEmailVerification: true,
  allowInstructorRegistration: false,
  courseApprovalRequired: true,
  assignmentApprovalRequired: false,
  certificateAutoIssue: true,

  twoFactorAuthentication: false,
  sessionTimeout: "30 minutes",
  passwordExpiry: "90 days",

  paymentGateway: "Paystack",
  paymentMode: "Test Mode",
  defaultCoursePrice: 50000,
  taxRate: 0,
};

// ---------------------------------------------------------
// ALLOWED FIELDS
// Prevent clients from updating arbitrary MongoDB fields.
// ---------------------------------------------------------
const ALLOWED_FIELDS = [
  "platformName",
  "platformEmail",
  "supportEmail",
  "phone",
  "description",

  "language",
  "timezone",
  "currency",

  "emailNotifications",
  "assignmentNotifications",
  "enrollmentNotifications",
  "certificateNotifications",
  "marketingNotifications",

  "allowStudentRegistration",
  "requireEmailVerification",
  "allowInstructorRegistration",
  "courseApprovalRequired",
  "assignmentApprovalRequired",
  "certificateAutoIssue",

  "twoFactorAuthentication",
  "sessionTimeout",
  "passwordExpiry",

  "paymentGateway",
  "paymentMode",
  "defaultCoursePrice",
  "taxRate",
];

// ---------------------------------------------------------
// GET SETTINGS
// GET /api/admin/settings
// ---------------------------------------------------------
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: "global" }).lean();

    // If settings don't exist yet, create the first document.
    if (!settings) {
      settings = await Settings.create({
        key: "global",
        ...DEFAULT_SETTINGS,
        updatedBy: req.user?._id || null,
      });

      settings = settings.toObject();
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load settings.",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------
// UPDATE SETTINGS
// PUT /api/admin/settings
// ---------------------------------------------------------
export const updateSettings = async (req, res) => {
  try {
    const incoming = req.body || {};

    const updates = {};

    // Only accept fields defined in ALLOWED_FIELDS.
    for (const field of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(incoming, field)) {
        updates[field] = incoming[field];
      }
    }

    // -------------------------------------------------------
    // NUMERIC VALIDATION
    // -------------------------------------------------------
    if (updates.defaultCoursePrice !== undefined) {
      const price = Number(updates.defaultCoursePrice);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Default course price must be a valid positive number.",
        });
      }

      updates.defaultCoursePrice = price;
    }

    if (updates.taxRate !== undefined) {
      const taxRate = Number(updates.taxRate);

      if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
        return res.status(400).json({
          success: false,
          message: "Tax rate must be between 0 and 100.",
        });
      }

      updates.taxRate = taxRate;
    }

    // -------------------------------------------------------
    // UPDATE DATABASE
    // -------------------------------------------------------
    const settings = await Settings.findOneAndUpdate(
      { key: "global" },
      {
        $set: {
          ...updates,
          updatedBy: req.user?._id || null,
        },
        $setOnInsert: {
          key: "global",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Settings saved successfully.",
      data: settings,
    });
  } catch (error) {
    console.error("UPDATE SETTINGS ERROR:", error);

    // Mongoose validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid settings value.",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save settings.",
      error: error.message,
    });
  }
};
