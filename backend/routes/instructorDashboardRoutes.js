import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { getDashboard } from "../controllers/instructorDashboardController.js";

const router = express.Router();

router.get("/", authenticate, authorize("instructor"), getDashboard);

export default router;
