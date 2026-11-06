import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary-v2";
import cloudinary from "../utils/cloudinary.js";
import path from "path";

// Course thumbnails, instructor-uploaded cover art, etc.
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sage-lms/images",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1280, crop: "limit" }],
  },
});

// Lesson video recordings.
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sage-lms/videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "webm"],
  },
});

const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const VIDEO_SIZE_LIMIT = 500 * 1024 * 1024; // 500MB

export const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: IMAGE_SIZE_LIMIT },
}).single("image");

export const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: VIDEO_SIZE_LIMIT },
}).single("video");

// ---- Student assignment submissions -------------------------------------
const SUBMISSION_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".zip",
  ".rar",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
];
// Cloudinary stores these as "image" resources (no extension in public_id).
const IMAGE_LIKE = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif"];

const submissionStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base =
      path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 60) || "file";
    const stamp = `${Date.now()}-${base}`;

    return {
      folder: "sage-lms/submissions",
      resource_type: "auto",
      // Raw files need the extension kept in the public_id to download properly
      public_id: IMAGE_LIKE.includes(ext) ? stamp : `${stamp}${ext}`,
    };
  },
});

const submissionUpload = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10MB each, 5 files
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (SUBMISSION_EXTENSIONS.includes(ext)) return cb(null, true);
    cb(new Error(`"${file.originalname}" is not a supported file type.`));
  },
}).array("files", 5);

export const uploadSubmissionFiles = (req, res, next) => {
  submissionUpload(req, res, (err) => {
    if (!err) return next();

    res.status(400);
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Each file must be 10MB or smaller."
        : err.code === "LIMIT_FILE_COUNT" ||
            err.code === "LIMIT_UNEXPECTED_FILE"
          ? "You can attach up to 5 files."
          : err.message || "File upload failed.";
    next(new Error(message));
  });
};

// ---- Instructor signatures -------------------------------------------------
const signatureStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sage-lms/signatures",
    resource_type: "image",
    allowed_formats: ["png", "jpg", "jpeg", "webp"],
    transformation: [{ width: 600, crop: "limit" }],
  },
});

export const uploadSignature = multer({
  storage: signatureStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("signature");

// ---- Profile photos --------------------------------------------------------
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sage-lms/avatars",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "auto" },
    ],
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error("Please choose a JPG, PNG or WebP image."));
  },
}).single("avatar");

export const uploadAvatar = (req, res, next) => {
  avatarUpload(req, res, (err) => {
    if (!err) return next();

    res.status(400);
    next(
      new Error(
        err.code === "LIMIT_FILE_SIZE"
          ? "Image must be 5MB or smaller."
          : err.message || "Image upload failed.",
      ),
    );
  });
};
