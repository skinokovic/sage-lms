import express from "express";
const router = express.Router();
import {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  googleLogin,
  facebookLogin,
  updateMyProfile,
  updateMyAvatar,
} from "../controllers/authController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadAvatar } from "../middleware/upload.js";

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, getMe);
router.patch("/change-password", authenticate, changePassword);

// Administrator profile
router.put("/me", authenticate, authorize("admin"), updateMyProfile);

router.post(
  "/me/avatar",
  authenticate,
  authorize("admin"),
  uploadAvatar,
  updateMyAvatar,
);
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);

export default router;
