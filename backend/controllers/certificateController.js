import asyncHandler from "express-async-handler";
import Certificate from "../models/Certificate.js";

// @desc    Get the current user's certificates
// @route   GET /api/certificates/me
// @access  Private
const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({
    userId: req.user._id,
  }).populate("courseId", "title");
  res.json({ success: true, count: certificates.length, certificates });
});

// @desc    Verify a certificate by its public code
// @route   GET /api/certificates/verify/:code
// @access  Public

const verifyCertificate = asyncHandler(async (req, res) => {
  const code = String(req.params.code || "")
    .trim()
    .toUpperCase();

  const certificate = await Certificate.findOne({ certificateCode: code })
    .populate("userId", "name")
    .populate("courseId", "title")
    .lean();

  if (!certificate) {
    res.status(404);
    throw new Error("Certificate not found or invalid code");
  }

  res.json({
    success: true,
    valid: true,
    certificate: {
      code: certificate.certificateCode,
      studentName: certificate.studentName || certificate.userId?.name || "",
      courseTitle: certificate.courseTitle || certificate.courseId?.title || "",
      instructorName: certificate.instructorName || "",
      issuedAt: certificate.issuedAt,
    },
  });
});

export { getMyCertificates, verifyCertificate };
