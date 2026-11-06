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
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, getMe);
router.patch("/change-password", authenticate, changePassword);
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);

export default router;
