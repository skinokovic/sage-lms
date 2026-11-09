import crypto from "node:crypto";
import mongoose from "mongoose";
import Course from "../models/Course.js"; // Adjust this import if your existing Course model has a different path/name.
import PaymentOrder from "../models/PaymentOrder.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  verifyPaystackSignature,
} from "../services/paystackService.js";
import { priceOrderWithCoupon } from "../services/couponService.js";

const ACCESS_STATUSES = ["active", "completed"];

const httpError = (message, statusCode) =>
  Object.assign(new Error(message), { statusCode });

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const asNaira = (value) => Number(value ?? 0);
const getCoursePrice = (course) =>
  asNaira(course.price ?? course.courseFee ?? course.amount ?? 0);
const getCourseTitle = (course) =>
  String(course.title || course.name || "Course");

function isPurchasable(course) {
  if (course.isPublished === false || course.published === false) return false;
  if (
    typeof course.status === "string" &&
    !["published", "active", "live"].includes(course.status.toLowerCase())
  )
    return false;
  return true;
}

function validateCustomer(body) {
  const customerName = String(body.name || body.customerName || "").trim();
  const customerEmail = normalizeEmail(body.email || body.customerEmail);
  const customerPhone = String(body.phone || body.customerPhone || "").trim();
  if (customerName.length < 2) throw httpError("Enter your full name.", 400);
  if (!/^\S+@\S+\.\S+$/.test(customerEmail))
    throw httpError("Enter a valid email address.", 400);
  if (customerPhone.length < 7)
    throw httpError("Enter a valid phone number.", 400);
  return { customerName, customerEmail, customerPhone };
}

async function loadAndPriceCourses(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw httpError("Your cart is empty.", 400);
  }
  const ids = [
    ...new Set(
      rawItems.map((item) =>
        String(item?.courseId || item?.id || item?._id || ""),
      ),
    ),
  ];
  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw httpError(
      "One or more course IDs are invalid. Refresh your cart and try again.",
      400,
    );
  }
  const courses = await Course.find({ _id: { $in: ids } });
  const byId = new Map(courses.map((course) => [String(course._id), course]));
  if (byId.size !== ids.length) {
    throw httpError("One or more courses are no longer available.", 409);
  }

  // Duplicate course IDs are removed so a course cannot be charged twice by manipulating the browser cart.
  const items = ids.map((id) => {
    const course = byId.get(id);
    if (!isPurchasable(course))
      throw httpError(
        `${getCourseTitle(course)} is not currently available for purchase.`,
        409,
      );
    const price = getCoursePrice(course);
    if (!Number.isFinite(price) || price <= 0)
      throw httpError(
        `${getCourseTitle(course)} does not have a valid paid-course price.`,
        400,
      );
    return {
      course: course._id,
      title: getCourseTitle(course),
      price: Math.round(price * 100) / 100,
    };
  });
  return { items };
}

// A student must not pay (or spend a coupon) on a course they already own.
async function assertNotAlreadyEnrolled(user, items) {
  const owned = await CourseEnrollment.find({
    course: { $in: items.map((item) => item.course) },
    status: { $in: ACCESS_STATUSES },
    $or: [{ user: user._id }, { studentEmail: normalizeEmail(user.email) }],
  }).select("course");

  if (owned.length === 0) return;

  const ownedIds = new Set(
    owned.map((enrollment) => String(enrollment.course)),
  );
  const titles = items
    .filter((item) => ownedIds.has(String(item.course)))
    .map((item) => item.title)
    .join(", ");
  throw httpError(
    `You are already enrolled in: ${titles}. Remove it from your cart to continue.`,
    409,
  );
}

// One enrolment per course. Safe to run any number of times.
async function enrollOrderItems(order) {
  for (const item of order.items) {
    await CourseEnrollment.updateOne(
      { course: item.course, studentEmail: order.customerEmail },
      {
        $setOnInsert: {
          user: order.user,
          course: item.course,
          studentEmail: order.customerEmail,
          studentName: order.customerName,
          studentPhone: order.customerPhone,
          paymentOrder: order._id,
          paymentReference: order.reference,
          status: "active",
          enrolledAt: order.paidAt || new Date(),
        },
      },
      { upsert: true },
    );
  }
}

async function fulfillPaidOrder(order, paystackData) {
  if (!order) return null;
  const amountKobo = Number(paystackData.amount);
  if (
    paystackData.status !== "success" ||
    paystackData.reference !== order.reference ||
    String(paystackData.currency || "").toUpperCase() !== order.currency ||
    amountKobo !== order.amountKobo
  ) {
    throw httpError(
      "Paystack verification did not match the expected order amount, currency, reference, or success status.",
      409,
    );
  }

  // Update is idempotent; repeat callbacks/webhooks do not create duplicate enrollments.
  await PaymentOrder.updateOne(
    { _id: order._id, status: { $ne: "paid" } },
    {
      $set: {
        status: "paid",
        paidAt: paystackData.paid_at
          ? new Date(paystackData.paid_at)
          : new Date(),
        paystackTransactionId: String(paystackData.id || ""),
        paystackChannel: String(paystackData.channel || ""),
        gatewayResponse: String(paystackData.gateway_response || ""),
        verificationPayload: {
          status: paystackData.status,
          reference: paystackData.reference,
          amount: amountKobo,
          currency: paystackData.currency,
          paid_at: paystackData.paid_at,
          channel: paystackData.channel,
        },
      },
    },
  );

  const currentOrder = await PaymentOrder.findById(order._id);
  await enrollOrderItems(currentOrder);
  return currentOrder;
}

const paidResponse = (order) => ({
  success: true,
  status: "paid",
  message: "Payment verified and course access has been recorded.",
  data: {
    reference: order.reference,
    amount: order.amountNaira,
    currency: order.currency,
    customerEmail: order.customerEmail,
    courses: order.items.map((item) => ({
      courseId: String(item.course),
      title: item.title,
    })),
  },
});

export async function initializePayment(req, res, next) {
  try {
    const customer = validateCustomer({
      ...(req.body || {}),
      email: req.user.email,
    });
    const paymentMethod = req.body?.method === "transfer" ? "transfer" : "card";
    const channels =
      paymentMethod === "transfer" ? ["bank_transfer"] : ["card"];

    // Prices always come from the database
    const { items: listItems } = await loadAndPriceCourses(req.body?.items);
    await assertNotAlreadyEnrolled(req.user, listItems);

    // Apply the coupon (if any) on the server; the browser's total is never trusted
    const pricing = await priceOrderWithCoupon({
      items: listItems,
      code: req.body?.couponCode,
      userId: req.user._id,
    });
    const { items, subtotal, discount, amountNaira, coupon } = pricing;
    const amountKobo = Math.round(amountNaira * 100);
    const reference = `SAGE-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;

    const orderFields = {
      reference,
      user: req.user._id,
      ...customer,
      items,
      subtotalNaira: subtotal,
      discountNaira: discount,
      ...(coupon ? { coupon } : {}),
      amountNaira,
      amountKobo,
      currency: "NGN",
    };

    // A coupon covered the whole price: nothing to charge, so enrol straight away.
    if (amountNaira === 0) {
      const order = await PaymentOrder.create({
        ...orderFields,
        method: "coupon",
        status: "paid",
        paidAt: new Date(),
      });
      await enrollOrderItems(order);

      return res.status(201).json({
        success: true,
        message: "You’re enrolled. No payment was needed.",
        data: { free: true, reference, amount: 0, currency: "NGN" },
      });
    }

    const order = await PaymentOrder.create({
      ...orderFields,
      method: paymentMethod,
      status: "pending",
    });

    try {
      const clientUrl = String(
        process.env.CLIENT_URL || "http://localhost:5173",
      ).replace(/\/$/, "");
      const transaction = await initializePaystackTransaction({
        email: customer.customerEmail,
        amountKobo,
        reference,
        callbackUrl: `${clientUrl}/payment/verify`,
        channels,
        metadata: {
          orderId: String(order._id),
          customerName: customer.customerName,
          couponCode: coupon?.code || "",
          custom_fields: [
            {
              display_name: "SAGE Order Reference",
              variable_name: "sage_order_reference",
              value: reference,
            },
          ],
          courses: items.map((item) => ({
            courseId: String(item.course),
            title: item.title,
          })),
        },
      });
      order.authorizationUrl = transaction.authorization_url;
      await order.save();
      return res.status(201).json({
        success: true,
        message: "Test payment initialized.",
        data: {
          authorizationUrl: transaction.authorization_url,
          reference,
          amount: amountNaira,
          currency: "NGN",
        },
      });
    } catch (error) {
      order.status = "failed";
      await order.save().catch(() => {});
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const reference = String(
      req.params.reference || req.query.reference || "",
    ).trim();
    if (!reference)
      return res
        .status(400)
        .json({ success: false, message: "Payment reference is required." });
    const order = await PaymentOrder.findOne({ reference, user: req.user._id });
    if (!order)
      return res.status(404).json({
        success: false,
        message: "No order was found for this payment reference.",
      });

    // Already settled (a free coupon order, or the webhook got there first):
    // there is nothing to ask Paystack, just make sure access is recorded.
    if (order.status === "paid") {
      await enrollOrderItems(order);
      return res.json(paidResponse(order));
    }

    const transaction = await verifyPaystackTransaction(reference);
    if (transaction.reference !== order.reference) {
      return res.status(409).json({
        success: false,
        status: "failed",
        message: "The payment reference did not match this order.",
      });
    }

    if (transaction.status === "success") {
      const paidOrder = await fulfillPaidOrder(order, transaction);
      return res.json(paidResponse(paidOrder));
    }

    if (
      ["pending", "ongoing", "processing", "queued"].includes(
        transaction.status,
      )
    ) {
      return res.status(202).json({
        success: false,
        status: "pending",
        message:
          "Paystack is still processing this payment. Please check again shortly.",
      });
    }

    await PaymentOrder.updateOne(
      { _id: order._id, status: { $ne: "paid" } },
      { $set: { status: "failed" } },
    );
    return res.status(402).json({
      success: false,
      status: "failed",
      message:
        "Paystack did not confirm a successful payment. You have not been charged by this LMS order.",
    });
  } catch (error) {
    next(error);
  }
}

export async function paystackWebhook(req, res, next) {
  try {
    const signature = req.get("x-paystack-signature");
    if (!verifyPaystackSignature(req.rawBody, signature)) {
      return res.status(401).json({
        success: false,
        message: "Invalid Paystack webhook signature.",
      });
    }
    const event = req.body;
    if (event?.event === "charge.success" && event?.data?.reference) {
      const order = await PaymentOrder.findOne({
        reference: String(event.data.reference),
      });
      if (order) {
        // Verify against Paystack's API as well; do not rely solely on browser redirect/webhook body.
        const verified = await verifyPaystackTransaction(order.reference);
        if (verified.status === "success")
          await fulfillPaidOrder(order, verified);
      }
    }
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export async function getOrderStatus(req, res, next) {
  try {
    const reference = String(req.params.reference || "").trim();
    const order = await PaymentOrder.findOne({
      reference,
      user: req.user._id,
    }).select(
      "reference status amountNaira currency customerEmail items.title items.course paidAt createdAt",
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    return res.json({
      success: true,
      data: {
        reference: order.reference,
        status: order.status,
        amount: order.amountNaira,
        currency: order.currency,
        customerEmail: order.customerEmail,
        paidAt: order.paidAt,
        courses: order.items.map((item) => ({
          courseId: String(item.course),
          title: item.title,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
