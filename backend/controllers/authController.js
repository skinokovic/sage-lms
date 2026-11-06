import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens.js";

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Only allow 'admin' role to be set by an already-authenticated admin in a
  // real system. For simplicity here, default new signups to 'student'.
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role === "admin" ? "student" : "student",
  });

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  res.status(201).json({
    success: true,
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash",
  );
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated");
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    success: true,
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  });
});

// @desc    Issue a new access token using a valid refresh token
// @route   POST /api/auth/refresh
// @access  Public (requires valid refresh token in body)
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400);
    throw new Error("Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id).select("+refreshTokenHash");
  if (!user || !user.refreshTokenHash) {
    res.status(401);
    throw new Error("Refresh token not recognized");
  }

  const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!isValid) {
    res.status(401);
    throw new Error("Refresh token not recognized");
  }

  const accessToken = generateAccessToken(user._id, user.role);
  res.json({ success: true, accessToken });
});

// @desc    Log out (invalidate stored refresh token)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  req.user.refreshTokenHash = undefined;
  await req.user.save();
  res.json({ success: true, message: "Logged out successfully" });
});

// @desc    Request a password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const genericResponse = {
    success: true,
    message: "If an account with that email exists, a reset link has been sent",
  };

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond the same way, so nobody can find out which emails exist.
  if (!user) {
    return res.json(genericResponse);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const expiryMinutes = Number(process.env.RESET_TOKEN_EXPIRES_MIN) || 30;

  user.resetToken = hashedToken;
  user.resetTokenExpiry = Date.now() + expiryMinutes * 60 * 1000;
  await user.save();

  // Trailing slashes in CLIENT_URL used to produce "//reset-password"
  const clientUrl = String(process.env.CLIENT_URL || "").replace(/\/+$/, "");
  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your SAGE LMS password",
      text: `Hi ${user.name || "there"},\n\nWe received a request to reset your password. Use the button below, or paste this link into your browser. It expires in ${expiryMinutes} minutes:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      action: { label: "Reset password", url: resetUrl },
    });
  } catch (error) {
    // Don't reveal the failure to the visitor, but make it visible in the logs
    console.error("Password reset email failed:", error.message);

    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
  }

  res.json(genericResponse);
});

// @desc    Reset password using a valid reset token
// @route   POST /api/auth/reset-password
// @access  Public
// const resetPassword = asyncHandler(async (req, res) => {
//   const { token, password } = req.body;

//   if (!token || !password) {
//     res.status(400);
//     throw new Error("Token and new password are required");
//   }

//   const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//   const user = await User.findOne({
//     resetToken: hashedToken,
//     resetTokenExpiry: { $gt: Date.now() },
//   }).select("+resetToken +resetTokenExpiry");

//   if (!user) {
//     res.status(400);
//     throw new Error("Reset token is invalid or has expired");
//   }

//   const salt = await bcrypt.genSalt(10);
//   user.passwordHash = await bcrypt.hash(password, salt);
//   user.resetToken = undefined;
//   user.resetTokenExpiry = undefined;
//   user.refreshTokenHash = undefined; // force re-login on all devices
//   await user.save();

//   res.json({ success: true, message: "Password has been reset successfully" });
// });

// @desc    Reset password using a valid reset token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // ============================================================
  // BASIC VALIDATION
  // ============================================================

  if (!token || !password) {
    res.status(400);
    throw new Error("Token and new password are required");
  }

  // ============================================================
  // PASSWORD VALIDATION
  // Keep this in sync with ResetPassword.jsx
  // ============================================================

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    res.status(400);
    throw new Error("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    res.status(400);
    throw new Error("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    res.status(400);
    throw new Error("Password must contain at least one number");
  }

  // ============================================================
  // HASH THE RESET TOKEN
  // ============================================================

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // ============================================================
  // FIND USER WITH VALID, UNEXPIRED TOKEN
  // ============================================================

  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: Date.now() },
  }).select("+resetToken +resetTokenExpiry");

  if (!user) {
    res.status(400);
    throw new Error("Reset token is invalid or has expired");
  }

  // ============================================================
  // HASH NEW PASSWORD
  // ============================================================

  const salt = await bcrypt.genSalt(10);

  user.passwordHash = await bcrypt.hash(password, salt);

  // ============================================================
  // INVALIDATE RESET TOKEN
  // ============================================================

  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;

  // Force the user to log in again on all devices.
  user.refreshTokenHash = undefined;

  await user.save();

  // ============================================================
  // RESPONSE
  // ============================================================

  res.json({
    success: true,
    message: "Password has been reset successfully",
  });
});

// @desc    Get the currently authenticated user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // --------------------------------------------------
  // 1. Validate input
  // --------------------------------------------------

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required");
  }

  // --------------------------------------------------
  // 2. Validate new password length
  // --------------------------------------------------

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("New password must be at least 8 characters");
  }

  // --------------------------------------------------
  // 3. Make sure user is authenticated
  // --------------------------------------------------

  if (!req.user?.id) {
    res.status(401);
    throw new Error("Authentication required");
  }

  // --------------------------------------------------
  // 4. Get user including passwordHash
  // --------------------------------------------------

  const user = await User.findById(req.user.id).select("+passwordHash");

  if (!user) {
    res.status(404);
    throw new Error("User account not found");
  }

  // --------------------------------------------------
  // 5. Verify current password
  // --------------------------------------------------

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  // --------------------------------------------------
  // 6. Prevent using the same password
  // --------------------------------------------------

  const isSamePassword = await user.comparePassword(newPassword);

  if (isSamePassword) {
    res.status(400);
    throw new Error(
      "New password must be different from your current password",
    );
  }

  // --------------------------------------------------
  // 7. Hash new password
  // --------------------------------------------------

  const salt = await bcrypt.genSalt(10);

  user.passwordHash = await bcrypt.hash(newPassword, salt);

  // --------------------------------------------------
  // 8. Remove temporary-password requirement
  // --------------------------------------------------

  user.mustChangePassword = false;

  // --------------------------------------------------
  // 9. Invalidate existing refresh token
  // --------------------------------------------------

  user.refreshTokenHash = undefined;

  // --------------------------------------------------
  // 10. Save changes
  // --------------------------------------------------

  await user.save();

  // --------------------------------------------------
  // 11. Return updated safe user
  // --------------------------------------------------

  res.json({
    success: true,
    message: "Password changed successfully.",
    user: user.toSafeObject(),
  });
});

/**
 * Finds the user by verified email, or creates a new account for them
 * (role defaults to "student", matching normal signup). A random,
 * never-used password hash is stored so the existing schema's
 * `passwordHash: required` is satisfied without any migration —
 * these accounts simply never log in with a password.
 */
const findOrCreateSocialUser = async ({ email, name, avatarUrl }) => {
  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) return user;

  const randomPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(randomPassword, 10);

  user = await User.create({
    name: name || email.split("@")[0],
    email: email.toLowerCase(),
    passwordHash,
    avatarUrl: avatarUrl || "",
    role: "student",
  });

  return user;
};

/** Issues the same token pair + response shape as the normal login. */
const issueSessionResponse = async (res, user) => {
  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated");
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    success: true,
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  });
};

// @desc    Log in (or sign up) using a Google OAuth access token
// @route   POST /api/auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
  const { accessToken: googleAccessToken } = req.body;

  if (!googleAccessToken) {
    res.status(400);
    throw new Error("Google access token is required");
  }

  let profile;
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleAccessToken}`,
    );

    if (!response.ok) {
      throw new Error("Google rejected the access token");
    }

    profile = await response.json();
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired Google access token");
  }

  if (!profile.email) {
    res.status(400);
    throw new Error("Your Google account has no email on file");
  }

  const user = await findOrCreateSocialUser({
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture,
  });

  await issueSessionResponse(res, user);
});

// @desc    Log in (or sign up) using a Facebook access token
// @route   POST /api/auth/facebook
// @access  Public
const facebookLogin = asyncHandler(async (req, res) => {
  const { accessToken: fbAccessToken } = req.body;

  if (!fbAccessToken) {
    res.status(400);
    throw new Error("Facebook access token is required");
  }

  let profile;
  try {
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${fbAccessToken}`,
    );

    profile = await response.json();

    if (profile.error) {
      throw new Error(profile.error.message);
    }
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired Facebook access token");
  }

  if (!profile.email) {
    res.status(400);
    throw new Error(
      "Your Facebook account has no email on file. Please use email/password or Google to sign in.",
    );
  }

  const user = await findOrCreateSocialUser({
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture?.data?.url,
  });

  await issueSessionResponse(res, user);
});

export {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  googleLogin,
  facebookLogin,
  changePassword,
};
