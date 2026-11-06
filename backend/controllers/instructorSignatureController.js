import asyncHandler from "express-async-handler";
import InstructorSignature from "../models/InstructorSignature.js";

// GET /api/instructor/signature
export const getMySignature = asyncHandler(async (req, res) => {
  const signature = await InstructorSignature.findOne({
    user: req.user._id,
  }).lean();

  res.json({
    success: true,
    signature: signature ? { url: signature.url } : null,
  });
});

// POST /api/instructor/signature  (multipart, field "signature")
// The old image is intentionally NOT deleted from Cloudinary: certificates
// already issued keep pointing at it.
export const saveMySignature = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No signature image was uploaded");
  }

  const signature = await InstructorSignature.findOneAndUpdate(
    { user: req.user._id },
    { $set: { url: req.file.path, publicId: req.file.filename } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  res.json({
    success: true,
    message: "Signature saved",
    signature: { url: signature.url },
  });
});

// DELETE /api/instructor/signature
export const deleteMySignature = asyncHandler(async (req, res) => {
  await InstructorSignature.deleteOne({ user: req.user._id });
  res.json({ success: true, message: "Signature removed" });
});
