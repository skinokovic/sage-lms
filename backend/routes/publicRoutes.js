import express from "express";
import { getPublicInstructors } from "../controllers/publicController.js";

const router = express.Router();

router.get("/instructors", getPublicInstructors);

export default router;
