import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import instructorApplicationRoutes from "./routes/instructorApplicationRoutes.js";
import adminStudentRoutes from "./routes/adminStudentRoutes.js";
import adminInstructorRoutes from "./routes/adminInstructorRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import adminEnrollmentRoutes from "./routes/adminEnrollmentRoutes.js";
import adminAssignmentRoutes from "./routes/adminAssignmentRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import instructorStudentRoutes from "./routes/instructorStudentRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import bankTransferRoutes from "./routes/bankTransferRoutes.js";
import adminBankTransferRoutes from "./routes/adminBanktransferRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import instructorSignatureRoutes from "./routes/instructorSignatureRoutes.js";
import instructorProfileRoutes from "./routes/instructorProfileRoutes.js";
import instructorScheduleRoutes from "./routes/instructorScheduleRoutes.js";
import instructorSubmissionRoutes from "./routes/instructorSubmissionRoutes.js";
import instructorAssignmentRoutes from "./routes/instructorAssignmentRoutes.js";
import instructorDashboardRoutes from "./routes/instructorDashboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import subscriberRoutes from "./routes/subscriberRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";

connectDB();

const app = express();

// --- Global middleware ---
app.use(helmet());
// app.use(cors());
const allowedOrigins = [process.env.VITE_CLIENT_URL, "http://localhost:5173"]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

app.use(
  cors({
    origin(origin, callback) {
      // Requests with no Origin (Paystack's webhook, curl, health checks) are allowed.
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(null, false);
    },
  }),
);

app.use(
  express.json({
    verify: (req, res, buffer) => {
      if (req.originalUrl.startsWith("/api/payments/webhook")) {
        req.rawBody = Buffer.from(buffer);
      }
    },
  }),
);

app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Basic rate limiting on auth routes to slow down brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});
app.use("/api/auth", authLimiter);

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/student", studentRoutes); // next to /api/progress
app.use("/api/certificates", certificateRoutes);
app.use("/api/instructor-applications", instructorApplicationRoutes);
app.use("/api/payments/bank-transfer", bankTransferRoutes);
app.use("/api/admin/bank-transfers", adminBankTransferRoutes); // above your other /api/admin lines
app.use("/api/admin/enrollments", adminEnrollmentRoutes);
app.use("/api/admin", adminStudentRoutes);
app.use("/api/admin", adminInstructorRoutes);
app.use("/api/admin", settingsRoutes);
app.use("/api/admin", adminAssignmentRoutes);
app.use("/api/admin", adminAnalyticsRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/instructor/students", instructorStudentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/instructor/signature", instructorSignatureRoutes);

// with the other routes
app.use("/api/instructor/profile", instructorProfileRoutes);
// with the other routes
app.use("/api/instructor/schedules", instructorScheduleRoutes);
app.use("/api/instructor/submissions", instructorSubmissionRoutes);
app.use("/api/instructor/assignments", instructorAssignmentRoutes);
app.use("/api/instructor/dashboard", instructorDashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/assistant", assistantRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `LMS backend running on port ${PORT} [${process.env.NODE_ENV || "development"}]`,
  );
});

export default app;
