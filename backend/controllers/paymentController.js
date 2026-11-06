import asyncHandler from "express-async-handler";
import Payment from "../models/PaymentOrder.js";
import Course from "../models/Course.js";
import Enrollment from "../models/CourseEnrollment.js";

// @desc    Create a payment record (initiate checkout)
// @route   POST /api/payments
// @access  Private
const createPayment = asyncHandler(async (req, res) => {
  const { courseId, provider } = req.body;

  if (!courseId) {
    res.status(400);
    throw new Error("courseId is required");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const payment = await Payment.create({
    userId: req.user._id,
    courseId,
    amount: course.price,
    provider: provider || "manual",
    status: "pending",
  });

  // In a real integration, you'd call the payment provider's API here
  // (e.g. Stripe PaymentIntent) and return a client secret / checkout URL.
  res.status(201).json({ success: true, payment });
});

// @desc    Webhook / manual confirmation that a payment succeeded
// @route   POST /api/payments/:id/confirm
// @access  Private (in production, this route should be a signed webhook, not user-callable)
const confirmPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  payment.status = "succeeded";
  payment.providerRef = req.body.providerRef || payment.providerRef;
  await payment.save();

  // Auto-enroll the user once payment succeeds
  let enrollment = await Enrollment.findOne({
    userId: payment.userId,
    courseId: payment.courseId,
  });
  if (!enrollment) {
    enrollment = await Enrollment.create({
      userId: payment.userId,
      courseId: payment.courseId,
    });
  }
  payment.enrollmentId = enrollment._id;
  await payment.save();

  res.json({ success: true, payment, enrollment });
});

// @desc    Get the current user's payment history
// @route   GET /api/payments/me
// @access  Private
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ userId: req.user._id }).populate(
    "courseId",
    "title price",
  );
  res.json({ success: true, count: payments.length, payments });
});

export { createPayment, confirmPayment, getMyPayments };
