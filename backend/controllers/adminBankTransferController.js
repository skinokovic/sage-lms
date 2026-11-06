import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import BankTransferRequest from "../models/bankTransferRequest.js";

const ACCESS_STATUSES = ["active", "completed"];
const STATUSES = ["pending", "approved", "rejected"];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toRow = (request) => ({
  id: String(request._id),
  reference: request.reference,
  status: request.status,
  student: {
    id: String(request.user?._id || request.user),
    name: request.customerName,
    email: request.customerEmail,
    phone: request.customerPhone,
  },
  courses: request.items.map((item) => ({
    courseId: String(item.course),
    title: item.title,
    price: item.price,
  })),
  amount: request.amountNaira,
  senderName: request.senderName,
  transferReference: request.transferReference || "",
  transferDate: request.transferDate,
  note: request.note || "",
  submittedAt: request.createdAt,
  reviewedAt: request.reviewedAt,
  reviewedBy: request.reviewedBy?.name || "",
  rejectionReason: request.rejectionReason || "",
  adminNote: request.adminNote || "",
});

/* ------------------------------------------------------------------ */
/* GET /api/admin/bank-transfers                                       */
/* ------------------------------------------------------------------ */

// @desc    List bank transfer requests with counts per status
// @query   status (pending|approved|rejected|All), search, page, limit
// @access  Private (admin)
export const listBankTransfers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const query = {};
  const { status } = req.query;
  if (STATUSES.includes(status)) query.status = status;

  const search = String(req.query.search || "").trim();
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { reference: pattern },
      { customerName: pattern },
      { customerEmail: pattern },
      { senderName: pattern },
      { transferReference: pattern },
    ];
  }

  const [total, requests, statusCounts] = await Promise.all([
    BankTransferRequest.countDocuments(query),
    BankTransferRequest.find(query)
      // Waiting requests first (oldest first), then newest reviews.
      .sort(status === "pending" ? { createdAt: 1 } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("reviewedBy", "name")
      .lean(),
    BankTransferRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const counts = { pending: 0, approved: 0, rejected: 0 };
  statusCounts.forEach((item) => {
    if (item._id in counts) counts[item._id] = item.count;
  });

  res.json({
    success: true,
    requests: requests.map(toRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
    counts,
  });
});

/* ------------------------------------------------------------------ */
/* POST /api/admin/bank-transfers/:id/approve                          */
/* ------------------------------------------------------------------ */

// @desc    Confirm the transfer arrived: enroll the student in every course
// @body    { adminNote? }
// @access  Private (admin)
export const approveBankTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminNote = String(req.body.adminNote || "").trim();

  if (!mongoose.isValidObjectId(id)) {
    res.status(404);
    throw new Error("Request not found.");
  }

  if (adminNote.length > 500) {
    res.status(400);
    throw new Error("The note must be 500 characters or fewer.");
  }

  // Claim the request first so two admins can't approve it twice.
  const request = await BankTransferRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    {
      $set: {
        status: "approved",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        adminNote,
      },
    },
    { new: true },
  );

  if (!request) {
    const exists = await BankTransferRequest.exists({ _id: id });
    res.status(exists ? 409 : 404);
    throw new Error(
      exists ? "This request has already been reviewed." : "Request not found.",
    );
  }

  try {
    const student = await User.findById(request.user).select(
      "name email phone isActive",
    );

    if (!student) {
      res.status(404);
      throw new Error("The student's account no longer exists.");
    }

    const results = [];

    for (const item of request.items) {
      const course = await Course.findById(item.course).select("title");

      if (!course) {
        results.push({
          courseId: String(item.course),
          title: item.title,
          outcome: "skipped",
          message: "This course no longer exists.",
        });
        continue;
      }

      const existing = await CourseEnrollment.findOne({
        course: course._id,
        $or: [{ user: student._id }, { studentEmail: student.email }],
      });

      if (existing && ACCESS_STATUSES.includes(existing.status)) {
        results.push({
          courseId: String(item.course),
          title: course.title,
          outcome: "already_enrolled",
          message: "Already enrolled in this course.",
        });
        continue;
      }

      const details = {
        user: student._id,
        studentEmail: student.email,
        studentName: student.name,
        studentPhone: request.customerPhone || student.phone || "",
        status: "active",
        paymentMethod: "bank_transfer",
        amountPaid: item.price,
        paymentReference: request.transferReference || request.reference,
        enrolledBy: req.user._id,
        note: `Bank transfer request ${request.reference}`,
        enrolledAt: new Date(),
      };

      try {
        if (existing) {
          existing.set(details);
          await existing.save();
          results.push({
            courseId: String(item.course),
            title: course.title,
            outcome: "reactivated",
            message: "Enrollment restored.",
          });
        } else {
          await CourseEnrollment.create({ course: course._id, ...details });
          results.push({
            courseId: String(item.course),
            title: course.title,
            outcome: "enrolled",
            message: "Enrolled successfully.",
          });
        }
      } catch (error) {
        if (error?.code === 11000) {
          results.push({
            courseId: String(item.course),
            title: course.title,
            outcome: "already_enrolled",
            message: "Already enrolled in this course.",
          });
        } else {
          throw error;
        }
      }
    }

    res.json({
      success: true,
      message: "Transfer approved and the student has been enrolled.",
      results,
      request: toRow(request),
    });
  } catch (error) {
    // Something failed part-way: put the request back so it can be retried.
    await BankTransferRequest.updateOne(
      { _id: request._id },
      {
        $set: {
          status: "pending",
          reviewedBy: null,
          reviewedAt: null,
          adminNote: "",
        },
      },
    ).catch(() => {});

    throw error;
  }
});

/* ------------------------------------------------------------------ */
/* POST /api/admin/bank-transfers/:id/reject                           */
/* ------------------------------------------------------------------ */

// @desc    Reject a request (money not received, wrong amount, ...)
// @body    { reason }  shown to the student
// @access  Private (admin)
export const rejectBankTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reason = String(req.body.reason || "").trim();

  if (!mongoose.isValidObjectId(id)) {
    res.status(404);
    throw new Error("Request not found.");
  }

  if (reason.length < 3 || reason.length > 300) {
    res.status(400);
    throw new Error("Give the student a reason (3 to 300 characters).");
  }

  const request = await BankTransferRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    {
      $set: {
        status: "rejected",
        rejectionReason: reason,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!request) {
    const exists = await BankTransferRequest.exists({ _id: id });
    res.status(exists ? 409 : 404);
    throw new Error(
      exists ? "This request has already been reviewed." : "Request not found.",
    );
  }

  res.json({
    success: true,
    message: "Request rejected.",
    request: toRow(request),
  });
});
