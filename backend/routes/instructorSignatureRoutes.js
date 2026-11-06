import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadSignature } from "../middleware/upload.js";
import {
  getMySignature,
  saveMySignature,
  deleteMySignature,
} from "../controllers/instructorSignatureController.js";

const router = express.Router();

router.use(authenticate, authorize("instructor"));

router.get("/", getMySignature);
router.post("/", uploadSignature, saveMySignature);
router.delete("/", deleteMySignature);

export default router;
