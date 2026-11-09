import crypto from "node:crypto";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import BankTransferRequest from "../models/bankTransferRequest.js";
import {
  priceOrderWithCoupon,
  CouponError,
} from "../services/couponService.js";

const ACCESS_STATUSES = ["active", "completed"];
const MAX_ITEMS = 20;
const MAX_DAYS_BACK = 60;

const round2 = (value) => Math.round(value * 100) / 100;

// The school's bank account, read from the backend .env so it can be changed
// without touching code.
const readBankDetails = () => {
  const bankName = String(process.env.BANK_NAME || "").trim();
  const accountNumber = String(process.env.BANK_ACCOUNT_NUMBER || "").trim();

  return {
    bankName,
    accountName:
      String(process.env.BANK_ACCOUNT_NAME || "").trim() ||
      "SAGE School of Business and Management",
    accountNumber,
    configured: Boolean(bankName && accountNumber),
  };
};

// Prices always come from the database, never from the browser.
const loadAndPriceCourses = async (rawItems, res) => {
  if (
    !Array.isArray(rawItems) ||
    rawItems.length === 0 ||
    rawItems.length > MAX_ITEMS
  ) {
    res.status(400);
    throw new Error("Your cart is empty.");
  }

  const ids = [
    ...new Set(
      rawItems.map((item) =>
        String(item?.courseId || item?.id || item?._id || ""),
      ),
    ),
  ];

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    res.status(400);
    throw new Error(
      "One or more course IDs are invalid. Refresh your cart and try again.",
    );
  }

  const courses = await Course.find({ _id: { $in: ids } }).select(
    "title price status",
  );
  const byId = new Map(courses.map((course) => [String(course._id), course]));

  if (byId.size !== ids.length) {
    res.status(409);
    throw new Error("One or more courses are no longer available.");
  }

  const items = ids.map((id) => {
    const course = byId.get(id);

    if (course.status !== "Published") {
      res.status(409);
      throw new Error(
        `${course.title} is not currently available for purchase.`,
      );
    }

    const price = Number(course.price || 0);

    if (!Number.isFinite(price) || price <= 0) {
      res.status(400);
      throw new Error(
        `${course.title} does not have a valid paid-course price.`,
      );
    }

    return { course: course._id, title: course.title, price: round2(price) };
  });

  return {
    items,
    amountNaira: round2(items.reduce((sum, item) => sum + item.price, 0)),
  };
};

/* ------------------------------------------------------------------ */
/* GET /api/payments/bank-transfer/details                             */
/* ------------------------------------------------------------------ */

// @desc    Bank account details to show on the checkout page
// @access  Private (student)
export const getBankDetails = asyncHandler(async (req, res) => {
  res.json({ success: true, details: readBankDetails() });
});

/* ------------------------------------------------------------------ */
/* POST /api/payments/bank-transfer                                    */
/* ------------------------------------------------------------------ */

// @desc    Student says they have paid by bank transfer; waits for admin approval
// @body    { items: [{ courseId }], couponCode?, senderName, transferReference?,
//            transferDate, note?, phone? }
// @access  Private (student)
export const createBankTransferRequest = asyncHandler(async (req, res) => {
  if (!readBankDetails().configured) {
    res.status(503);
    throw new Error(
      "Bank transfer isn't available right now. Please pay with Paystack.",
    );
  }

  const senderName = String(req.body.senderName || "").trim();
  const transferReference = String(req.body.transferReference || "").trim();
  const note = String(req.body.note || "").trim();
  const phone = String(req.body.phone || req.user.phone || "").trim();

  if (senderName.length < 2 || senderName.length > 100) {
    res.status(400);
    throw new Error("Enter the account name the money was sent from.");
  }

  if (transferReference.length > 100) {
    res.status(400);
    throw new Error("The transfer reference is too long.");
  }

  if (note.length > 500) {
    res.status(400);
    throw new Error("The note must be 500 characters or fewer.");
  }

  if (phone.length < 7) {
    res.status(400);
    throw new Error("Enter a valid phone number.");
  }

  const transferDate = new Date(req.body.transferDate);

  if (Number.isNaN(transferDate.getTime())) {
    res.status(400);
    throw new Error("Enter the date you made the transfer.");
  }

  const now = Date.now();
  // A day of slack covers time zones; no future dates and nothing too old.
  if (transferDate.getTime() > now + 24 * 60 * 60 * 1000) {
    res.status(400);
    throw new Error("The transfer date can't be in the future.");
  }

  if (transferDate.getTime() < now - MAX_DAYS_BACK * 24 * 60 * 60 * 1000) {
    res.status(400);
    throw new Error(
      `The transfer date is too old. Contact the school if you paid more than ${MAX_DAYS_BACK} days ago.`,
    );
  }

  const { items: listItems } = await loadAndPriceCourses(req.body.items, res);
  const courseIds = listItems.map((item) => item.course);

  // Don't take a payment claim for a course the student already has.
  const owned = await CourseEnrollment.find({
    course: { $in: courseIds },
    status: { $in: ACCESS_STATUSES },
    $or: [
      { user: req.user._id },
      { studentEmail: String(req.user.email || "").toLowerCase() },
    ],
  }).select("course");

  if (owned.length > 0) {
    const ownedIds = new Set(
      owned.map((enrollment) => String(enrollment.course)),
    );
    const titles = listItems
      .filter((item) => ownedIds.has(String(item.course)))
      .map((item) => item.title)
      .join(", ");

    res.status(409);
    throw new Error(
      `You are already enrolled in: ${titles}. Remove it from your cart to continue.`,
    );
  }

  // One waiting request per course is enough.
  const pending = await BankTransferRequest.findOne({
    user: req.user._id,
    status: "pending",
    "items.course": { $in: courseIds },
  }).select("reference items");

  if (pending) {
    const pendingIds = new Set(
      pending.items.map((item) => String(item.course)),
    );
    const titles = listItems
      .filter((item) => pendingIds.has(String(item.course)))
      .map((item) => item.title)
      .join(", ");

    res.status(409);
    throw new Error(
      `You already have a bank transfer waiting for confirmation for: ${titles} (reference ${pending.reference}).`,
    );
  }

  // Apply the coupon (if any) on the server
  let pricing;
  try {
    pricing = await priceOrderWithCoupon({
      items: listItems,
      code: req.body.couponCode,
      userId: req.user._id,
    });
  } catch (err) {
    if (err instanceof CouponError) res.status(err.statusCode);
    throw err;
  }

  if (pricing.amountNaira <= 0) {
    res.status(400);
    throw new Error(
      "Your coupon covers the whole price, so there is nothing to transfer. Complete checkout to enroll for free.",
    );
  }

  const reference = `BT-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;

  const request = await BankTransferRequest.create({
    reference,
    user: req.user._id,
    customerName: req.user.name,
    customerEmail: req.user.email,
    customerPhone: phone,
    items: pricing.items,
    subtotalNaira: pricing.subtotal,
    discountNaira: pricing.discount,
    ...(pricing.coupon ? { coupon: pricing.coupon } : {}),
    amountNaira: pricing.amountNaira,
    senderName,
    transferReference,
    transferDate,
    note,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message:
      "Transfer submitted. We'll confirm it and enroll you as soon as possible.",
    request: {
      id: String(request._id),
      reference: request.reference,
      amount: request.amountNaira,
      discount: request.discountNaira || 0,
      couponCode: request.coupon?.code || "",
      status: request.status,
      createdAt: request.createdAt,
      courses: request.items.map((item) => ({
        courseId: String(item.course),
        title: item.title,
      })),
    },
  });
});

/* ------------------------------------------------------------------ */
/* GET /api/payments/bank-transfer/mine                                */
/* ------------------------------------------------------------------ */

// @desc    The logged-in student's own bank transfer requests
// @access  Private (student)
export const getMyBankTransfers = asyncHandler(async (req, res) => {
  const requests = await BankTransferRequest.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.json({
    success: true,
    requests: requests.map((request) => ({
      id: String(request._id),
      reference: request.reference,
      amount: request.amountNaira,
      status: request.status,
      rejectionReason: request.rejectionReason || "",
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt,
      courses: request.items.map((item) => ({
        courseId: String(item.course),
        title: item.title,
      })),
    })),
  });
});
