import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/instructorScheduleController.js";

const router = express.Router();

router.use(authenticate, authorize("instructor"));

router.get("/", getSchedules);
router.get("/:id", getSchedule);
router.post("/", createSchedule);
router.patch("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

export default router;
