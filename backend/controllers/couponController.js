import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Coupon from "../models/Coupon.js";
import Course from "../models/Course.js";
import PaymentOrder from "../models/PaymentOrder.js";
import BankTransferRequest from "../models/bankTransferRequest.js";
import {
  CouponError,
  normalizeCode,
  loadCartCourses,
  validateCouponForCart,
  getUsageForMany,
  couponStatus,
} from "../services/couponService.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Turns a CouponError into the right HTTP status, then rethrows it
const rethrow = (err, res) => {
  if (err instanceof CouponError) res.status(err.statusCode);
  throw err;
};

/* ------------------------------------------------------------------ */
/* PUBLIC: check a code against the cart                               */
/* ------------------------------------------------------------------ */

// @desc    Check a coupon against the cart and return the discounted prices
// @route   POST /api/coupons/validate     body: { code, items: [{ courseId }] }
// @access  Public (a logged-in student also gets the per-student limit checked)
const validateCoupon = asyncHandler(async (req, res) => {
  try {
    const items = await loadCartCourses(req.body?.items);
    const { coupon, pricing } = await validateCouponForCart({
      code: req.body?.code,
      items,
      userId: req.user?._id,
    });

    res.json({
      success: true,
      valid: true,
      message: "Coupon applied.",
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        expiresAt: coupon.expiresAt,
      },
      ...pricing,
    });
  } catch (err) {
    rethrow(err, res);
  }
});

/* ------------------------------------------------------------------ */
/* ADMIN                                                               */
/* ------------------------------------------------------------------ */

const shapeCoupon = (coupon, usage = {}, now = new Date()) => {
  const redeemed = usage.redeemed || 0;
  const pending = usage.pending || 0;

  return {
    id: String(coupon._id),
    code: coupon.code,
    description: coupon.description || "",
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscountNaira: coupon.maxDiscountNaira ?? null,
    minOrderNaira: coupon.minOrderNaira || 0,
    appliesTo: coupon.appliesTo,
    courses: (coupon.courses || [])
      .filter(Boolean)
      .map((course) => ({
        id: String(course._id || course),
        title: course.title || "",
      })),
    startsAt: coupon.startsAt || null,
    expiresAt: coupon.expiresAt || null,
    usageLimit: coupon.usageLimit ?? null,
    perUserLimit: coupon.perUserLimit || 1,
    isActive: coupon.isActive,
    status: couponStatus(coupon, redeemed + pending, now),
    redeemed,
    pending,
    discountGiven: usage.discountGiven || 0,
    createdAt: coupon.createdAt,
  };
};

// Validates the coupon form. Throws 400 with a clear message on bad input.
const parseCouponBody = async (body = {}, res) => {
  const fail = (message) => {
    res.status(400);
    throw new Error(message);
  };

  const code = normalizeCode(body.code);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    fail("The code must be 3 to 30 letters, numbers, hyphens or underscores.");
  }

  const description = String(body.description || "").trim();
  if (description.length > 200)
    fail("The description must be 200 characters or fewer.");

  const discountType = body.discountType;
  if (!["percentage", "fixed"].includes(discountType)) {
    fail("Choose a discount type.");
  }

  const discountValue = Number(body.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    fail("Enter a discount greater than zero.");
  }
  if (discountType === "percentage" && discountValue > 100) {
    fail("A percentage discount can’t be more than 100.");
  }
  if (discountType === "fixed" && discountValue > 10_000_000) {
    fail("That fixed discount is too large.");
  }

  let maxDiscountNaira = null;
  if (
    discountType === "percentage" &&
    body.maxDiscountNaira !== "" &&
    body.maxDiscountNaira != null
  ) {
    maxDiscountNaira = Number(body.maxDiscountNaira);
    if (!Number.isFinite(maxDiscountNaira) || maxDiscountNaira <= 0) {
      fail("The maximum discount must be greater than zero.");
    }
  }

  const minOrderNaira =
    body.minOrderNaira === "" || body.minOrderNaira == null
      ? 0
      : Number(body.minOrderNaira);
  if (!Number.isFinite(minOrderNaira) || minOrderNaira < 0) {
    fail("The minimum order can’t be negative.");
  }

  const appliesTo = body.appliesTo === "courses" ? "courses" : "all";
  let courses = [];
  if (appliesTo === "courses") {
    const ids = [
      ...new Set((Array.isArray(body.courses) ? body.courses : []).map(String)),
    ];
    if (ids.length === 0 || ids.length > 100)
      fail("Choose between 1 and 100 courses.");
    if (ids.some((id) => !mongoose.isValidObjectId(id)))
      fail("One of the chosen courses is invalid.");
    const found = await Course.countDocuments({ _id: { $in: ids } });
    if (found !== ids.length)
      fail("One of the chosen courses no longer exists.");
    courses = ids;
  }

  const toDate = (value, label) => {
    if (value === "" || value == null) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) fail(`The ${label} date isn’t valid.`);
    return date;
  };
  const startsAt = toDate(body.startsAt, "start");
  const expiresAt = toDate(body.expiresAt, "expiry");
  if (startsAt && expiresAt && startsAt >= expiresAt) {
    fail("The expiry must be after the start.");
  }

  let usageLimit = null;
  if (body.usageLimit !== "" && body.usageLimit != null) {
    usageLimit = Number(body.usageLimit);
    if (!Number.isInteger(usageLimit) || usageLimit < 1)
      fail("The usage limit must be a whole number, 1 or more.");
  }

  const perUserLimit =
    body.perUserLimit === "" || body.perUserLimit == null
      ? 1
      : Number(body.perUserLimit);
  if (
    !Number.isInteger(perUserLimit) ||
    perUserLimit < 1 ||
    perUserLimit > 100
  ) {
    fail("Uses per student must be a whole number from 1 to 100.");
  }

  return {
    code,
    description,
    discountType,
    discountValue,
    maxDiscountNaira,
    minOrderNaira,
    appliesTo,
    courses,
    startsAt,
    expiresAt,
    usageLimit,
    perUserLimit,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };
};

const hasOrders = async (couponId) => {
  const [order, transfer] = await Promise.all([
    PaymentOrder.exists({ "coupon.couponId": couponId }),
    BankTransferRequest.exists({ "coupon.couponId": couponId }),
  ]);
  return Boolean(order || transfer);
};

// @route GET /api/admin/coupons?search=&status=&page=&limit=
const listCoupons = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const filter = {};
  if (req.query.search?.trim()) {
    const pattern = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ code: pattern }, { description: pattern }];
  }

  const coupons = await Coupon.find(filter)
    .sort({ createdAt: -1 })
    .populate("courses", "title")
    .lean();

  const usage = await getUsageForMany(coupons.map((c) => c._id));
  const now = new Date();
  const all = coupons.map((c) => shapeCoupon(c, usage.get(String(c._id)), now));

  const status = req.query.status;
  const matching =
    status && status !== "all" ? all.filter((c) => c.status === status) : all;

  res.json({
    success: true,
    coupons: matching.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      total: matching.length,
      totalPages: Math.max(Math.ceil(matching.length / limit), 1),
    },
    stats: {
      total: all.length,
      active: all.filter((c) => c.status === "active").length,
      redemptions: all.reduce((sum, c) => sum + c.redeemed, 0),
      discountGiven: all.reduce((sum, c) => sum + c.discountGiven, 0),
    },
  });
});

// @route POST /api/admin/coupons
const createCoupon = asyncHandler(async (req, res) => {
  const data = await parseCouponBody(req.body, res);

  if (data.expiresAt && data.expiresAt <= new Date()) {
    res.status(400);
    throw new Error("The expiry must be in the future.");
  }
  if (await Coupon.exists({ code: data.code })) {
    res.status(409);
    throw new Error("A coupon with this code already exists.");
  }

  let coupon;
  try {
    coupon = await Coupon.create({ ...data, createdBy: req.user._id });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error("A coupon with this code already exists.");
    }
    throw err;
  }

  res
    .status(201)
    .json({ success: true, coupon: shapeCoupon(coupon.toObject()) });
});

// @route PATCH /api/admin/coupons/:id   (send the whole form)
const updateCoupon = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404);
    throw new Error("Coupon not found.");
  }
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found.");
  }

  const data = await parseCouponBody(req.body, res);

  if (data.code !== coupon.code) {
    if (await hasOrders(coupon._id)) {
      res.status(409);
      throw new Error(
        "This coupon has been used, so its code can’t be changed. Create a new coupon instead.",
      );
    }
    if (await Coupon.exists({ code: data.code, _id: { $ne: coupon._id } })) {
      res.status(409);
      throw new Error("A coupon with this code already exists.");
    }
  }

  coupon.set(data);
  await coupon.save();
  await coupon.populate("courses", "title");

  res.json({ success: true, coupon: shapeCoupon(coupon.toObject()) });
});

// @route PATCH /api/admin/coupons/:id/status   body: { isActive }
const setCouponStatus = asyncHandler(async (req, res) => {
  if (
    !mongoose.isValidObjectId(req.params.id) ||
    typeof req.body?.isActive !== "boolean"
  ) {
    res.status(400);
    throw new Error("Send isActive as true or false.");
  }
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true },
  );
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found.");
  }
  res.json({ success: true, isActive: coupon.isActive });
});

// @route DELETE /api/admin/coupons/:id
// A coupon that was ever used is deactivated instead, so order history stays accurate.
const deleteCoupon = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404);
    throw new Error("Coupon not found.");
  }
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found.");
  }

  if (await hasOrders(coupon._id)) {
    coupon.isActive = false;
    await coupon.save();
    return res.json({
      success: true,
      archived: true,
      message:
        "This coupon has been used, so it was deactivated instead of deleted.",
    });
  }

  await coupon.deleteOne();
  res.json({ success: true, archived: false, message: "Coupon deleted." });
});

// @route GET /api/admin/coupons/:id/redemptions   (latest 25)
const getRedemptions = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404);
    throw new Error("Coupon not found.");
  }
  const id = new mongoose.Types.ObjectId(req.params.id);

  const [orders, transfers] = await Promise.all([
    PaymentOrder.find({ "coupon.couponId": id, status: "paid" })
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(25)
      .select(
        "reference customerName customerEmail items discountNaira amountNaira method paidAt createdAt",
      )
      .lean(),
    BankTransferRequest.find({
      "coupon.couponId": id,
      status: { $in: ["pending", "approved"] },
    })
      .sort({ createdAt: -1 })
      .limit(25)
      .select(
        "reference customerName customerEmail items discountNaira amountNaira status createdAt",
      )
      .lean(),
  ]);

  const rows = [
    ...orders.map((o) => ({
      reference: o.reference,
      name: o.customerName,
      email: o.customerEmail,
      courses: (o.items || []).map((i) => i.title),
      discount: o.discountNaira || 0,
      amount: o.amountNaira,
      via: o.method === "coupon" ? "Free with coupon" : "Card",
      status: "paid",
      date: o.paidAt || o.createdAt,
    })),
    ...transfers.map((t) => ({
      reference: t.reference,
      name: t.customerName,
      email: t.customerEmail,
      courses: (t.items || []).map((i) => i.title),
      discount: t.discountNaira || 0,
      amount: t.amountNaira,
      via: "Bank transfer",
      status: t.status,
      date: t.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 25);

  res.json({ success: true, redemptions: rows });
});

export {
  validateCoupon,
  listCoupons,
  createCoupon,
  updateCoupon,
  setCouponStatus,
  deleteCoupon,
  getRedemptions,
};
