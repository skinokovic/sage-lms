import mongoose from "mongoose";
import Coupon from "../models/Coupon.js";
import Course from "../models/Course.js";
import PaymentOrder from "../models/PaymentOrder.js";
import BankTransferRequest from "../models/bankTransferRequest.js";

/*
  How redemptions are counted (no extra bookkeeping to keep in sync):
    - a coupon is "used" when a card/free order is PAID, or
    - when a bank-transfer request is APPROVED;
    - a PENDING bank transfer holds the coupon (so a limited coupon can't be
      over-claimed while an admin is still reviewing), and it is released
      automatically if the request is rejected.
  A card order that is merely started (pending) does not use up a coupon.
*/

export class CouponError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "CouponError";
    this.statusCode = statusCode;
  }
}

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const money = (n) => `₦${Number(n).toLocaleString("en-NG")}`;

// Read lazily (ES modules import before dotenv.config() runs)
export const minChargeNaira = () => Number(process.env.MIN_CHARGE_NAIRA) || 100;

export const normalizeCode = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 30);

/* ------------------------------------------------------------------ */
/* The discount maths (pure, so it can be tested without a database)   */
/* ------------------------------------------------------------------ */

// items: [{ courseId, price }]   coupon: a Coupon (or plain object)
// Returns { subtotal, discount, total, items: [{ courseId, price, discount, finalPrice, eligible }] }
export function computeDiscount(items, coupon) {
  const allowed = new Set((coupon.courses || []).map((id) => String(id)));

  const lines = items.map((item) => ({
    courseId: String(item.courseId),
    price: round2(item.price),
    discount: 0,
    finalPrice: round2(item.price),
    eligible:
      Number(item.price) > 0 &&
      (coupon.appliesTo !== "courses" || allowed.has(String(item.courseId))),
  }));

  const eligible = lines.filter((line) => line.eligible);
  if (eligible.length === 0) {
    throw new CouponError(
      "This coupon doesn’t apply to the courses in your cart.",
    );
  }

  const eligibleSubtotal = round2(
    eligible.reduce((sum, l) => sum + l.price, 0),
  );

  if (eligibleSubtotal < Number(coupon.minOrderNaira || 0)) {
    throw new CouponError(
      `This coupon needs at least ${money(coupon.minOrderNaira)} of ${
        coupon.appliesTo === "courses" ? "eligible courses" : "courses"
      } in your order.`,
    );
  }

  let discount =
    coupon.discountType === "percentage"
      ? (eligibleSubtotal * Math.min(Number(coupon.discountValue), 100)) / 100
      : Number(coupon.discountValue);

  if (coupon.discountType === "percentage" && coupon.maxDiscountNaira) {
    discount = Math.min(discount, Number(coupon.maxDiscountNaira));
  }
  discount = round2(Math.min(discount, eligibleSubtotal));

  // Spread the discount across eligible courses in proportion to their price;
  // the last one absorbs rounding so the lines add up exactly.
  let allocated = 0;
  eligible.forEach((line, index) => {
    const share =
      index === eligible.length - 1
        ? round2(discount - allocated)
        : round2((discount * line.price) / eligibleSubtotal);
    line.discount = Math.max(0, Math.min(share, line.price));
    line.finalPrice = round2(line.price - line.discount);
    allocated = round2(allocated + line.discount);
  });

  const subtotal = round2(lines.reduce((sum, l) => sum + l.price, 0));
  const totalDiscount = round2(lines.reduce((sum, l) => sum + l.discount, 0));

  return {
    subtotal,
    discount: totalDiscount,
    total: round2(subtotal - totalDiscount),
    items: lines,
  };
}

/* ------------------------------------------------------------------ */
/* Redemption counts                                                   */
/* ------------------------------------------------------------------ */

const TRANSFER_HELD = ["pending", "approved"];

export async function getUsage(couponId) {
  const [paid, approved, pending] = await Promise.all([
    PaymentOrder.countDocuments({
      "coupon.couponId": couponId,
      status: "paid",
    }),
    BankTransferRequest.countDocuments({
      "coupon.couponId": couponId,
      status: "approved",
    }),
    BankTransferRequest.countDocuments({
      "coupon.couponId": couponId,
      status: "pending",
    }),
  ]);
  return {
    redeemed: paid + approved,
    pending,
    counted: paid + approved + pending,
  };
}

async function countUserUses(couponId, userId) {
  const [paid, transfers] = await Promise.all([
    PaymentOrder.countDocuments({
      user: userId,
      "coupon.couponId": couponId,
      status: "paid",
    }),
    BankTransferRequest.countDocuments({
      user: userId,
      "coupon.couponId": couponId,
      status: { $in: TRANSFER_HELD },
    }),
  ]);
  return paid + transfers;
}

// For the admin list: usage numbers for many coupons in two queries
export async function getUsageForMany(couponIds) {
  const result = new Map();
  const bucket = (id) => {
    const key = String(id);
    if (!result.has(key)) {
      result.set(key, { redeemed: 0, pending: 0, discountGiven: 0 });
    }
    return result.get(key);
  };

  if (couponIds.length === 0) return result;
  const ids = couponIds.map((id) => new mongoose.Types.ObjectId(String(id)));

  const [orders, transfers] = await Promise.all([
    PaymentOrder.aggregate([
      { $match: { "coupon.couponId": { $in: ids }, status: "paid" } },
      {
        $group: {
          _id: "$coupon.couponId",
          count: { $sum: 1 },
          discount: { $sum: "$discountNaira" },
        },
      },
    ]),
    BankTransferRequest.aggregate([
      {
        $match: {
          "coupon.couponId": { $in: ids },
          status: { $in: TRANSFER_HELD },
        },
      },
      {
        $group: {
          _id: { id: "$coupon.couponId", status: "$status" },
          count: { $sum: 1 },
          discount: { $sum: "$discountNaira" },
        },
      },
    ]),
  ]);

  orders.forEach((row) => {
    const b = bucket(row._id);
    b.redeemed += row.count;
    b.discountGiven += row.discount || 0;
  });
  transfers.forEach((row) => {
    const b = bucket(row._id.id);
    if (row._id.status === "approved") {
      b.redeemed += row.count;
      b.discountGiven += row.discount || 0;
    } else {
      b.pending += row.count;
    }
  });

  return result;
}

export const couponStatus = (coupon, counted, now = new Date()) => {
  if (!coupon.isActive) return "inactive";
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return "expired";
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return "scheduled";
  if (coupon.usageLimit && counted >= coupon.usageLimit) return "exhausted";
  return "active";
};

/* ------------------------------------------------------------------ */
/* Checking a code against a cart                                      */
/* ------------------------------------------------------------------ */

// Loads the cart's courses from the DB (prices are never taken from the browser)
export async function loadCartCourses(rawItems) {
  if (
    !Array.isArray(rawItems) ||
    rawItems.length === 0 ||
    rawItems.length > 20
  ) {
    throw new CouponError("Your cart is empty.");
  }

  const ids = [
    ...new Set(
      rawItems.map((item) =>
        String(item?.courseId || item?.id || item?._id || ""),
      ),
    ),
  ];

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw new CouponError(
      "One or more courses are invalid. Refresh your cart.",
    );
  }

  const courses = await Course.find({
    _id: { $in: ids },
    status: "Published",
  }).select("title price");

  if (courses.length !== ids.length) {
    throw new CouponError(
      "One or more courses in your cart are no longer available.",
      409,
    );
  }

  const byId = new Map(courses.map((course) => [String(course._id), course]));
  return ids.map((id) => {
    const course = byId.get(id);
    return {
      course: course._id,
      courseId: String(course._id),
      title: course.title,
      price: round2(Number(course.price || 0)),
    };
  });
}

// items: [{ courseId, price }]. Throws CouponError with a friendly message.
export async function validateCouponForCart({ code, items, userId }) {
  const normalized = normalizeCode(code);
  if (!normalized) throw new CouponError("Enter a coupon code.");

  const coupon = await Coupon.findOne({ code: normalized });
  if (!coupon || !coupon.isActive) {
    throw new CouponError("This coupon code isn’t valid.", 404);
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new CouponError("This coupon isn’t active yet.");
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw new CouponError("This coupon has expired.");
  }

  if (coupon.usageLimit) {
    const { counted } = await getUsage(coupon._id);
    if (counted >= coupon.usageLimit) {
      throw new CouponError("This coupon has reached its usage limit.");
    }
  }

  if (userId) {
    const used = await countUserUses(coupon._id, userId);
    if (used >= (coupon.perUserLimit || 1)) {
      throw new CouponError("You’ve already used this coupon.");
    }
  }

  const pricing = computeDiscount(items, coupon);

  if (pricing.total > 0 && pricing.total < minChargeNaira()) {
    throw new CouponError(
      `This coupon can’t be applied because the remaining amount would be below the ${money(
        minChargeNaira(),
      )} minimum payment.`,
    );
  }

  return { coupon, pricing };
}

// For creating an order. items: [{ course, title, price }] already priced from the DB.
// Returns the items with their coupon discount, the totals and a coupon snapshot.
export async function priceOrderWithCoupon({ items, code, userId }) {
  const subtotal = round2(items.reduce((sum, item) => sum + item.price, 0));

  if (!normalizeCode(code)) {
    return {
      items: items.map((item) => ({ ...item, discount: 0 })),
      subtotal,
      discount: 0,
      amountNaira: subtotal,
      coupon: null,
    };
  }

  const { coupon, pricing } = await validateCouponForCart({
    code,
    userId,
    items: items.map((item) => ({
      courseId: String(item.course),
      price: item.price,
    })),
  });

  const byCourse = new Map(pricing.items.map((line) => [line.courseId, line]));

  return {
    items: items.map((item) => ({
      ...item,
      discount: byCourse.get(String(item.course))?.discount || 0,
    })),
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    amountNaira: pricing.total,
    coupon: {
      couponId: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
  };
}
