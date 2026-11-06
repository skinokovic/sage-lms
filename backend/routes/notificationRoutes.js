import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getSummary,
  markAllRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(authenticate);

router.get("/summary", getSummary);
router.post("/read-all", markAllRead);

export default router;
