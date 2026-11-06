import express from "express";
const router = express.Router();
import {
  getMyCertificates,
  verifyCertificate,
} from "../controllers/certificateController.js";
import { authenticate } from "../middleware/auth.js";

router.get("/me", authenticate, getMyCertificates);
router.get("/verify/:code", verifyCertificate);

export default router;
