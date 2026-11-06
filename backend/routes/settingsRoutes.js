import express from "express";

import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController.js";

import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// ---------------------------------------------------------
// GET SETTINGS
// Admin only
// ---------------------------------------------------------
router.get("/settings", authenticate, authorize("admin"), getSettings);

// ---------------------------------------------------------
// UPDATE SETTINGS
// Admin only
// ---------------------------------------------------------
router.put("/settings", authenticate, authorize("admin"), updateSettings);

export default router;
