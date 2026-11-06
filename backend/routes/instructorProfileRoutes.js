import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadAvatar } from "../middleware/upload.js";
import {
  getMyProfile,
  updateMyProfile,
  updateMyAvatar,
} from "../controllers/instructorProfileController.js";

const router = express.Router();

router.use(authenticate, authorize("instructor"));

router.get("/", getMyProfile);
router.patch("/", updateMyProfile);
router.patch("/avatar", uploadAvatar, updateMyAvatar);

export default router;
