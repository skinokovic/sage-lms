import express from "express";

import {
  createStudent,
  getStudentById,
  updateStudent,
  getStudents,
  deleteStudent,
} from "../controllers/adminStudentController.js";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = express.Router();

router.get("/students", authenticate, adminOnly, getStudents);
router.get("/students/:id", authenticate, adminOnly, getStudentById);
router.post("/students", authenticate, adminOnly, createStudent);
router.patch("/students/:id", authenticate, adminOnly, updateStudent);
router.delete("/students/:id", authenticate, adminOnly, deleteStudent);

export default router;
