import express from "express";

import { getAnalytics } from "../controllers/adminAnalyticsController.js";

import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/analytics", authenticate, authorize("admin"), getAnalytics);

export default router;
