import express from "express";
import { getAdminDashboard } from "../controllers/adminDashboardController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/dashboard", authenticate, authorize("admin"), getAdminDashboard);

export default router;
