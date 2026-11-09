// import mongoose from "mongoose";

// const orderItemSchema = new mongoose.Schema(
//   {
//     course: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Course",
//       required: true,
//     },
//     title: { type: String, required: true, trim: true },
//     price: { type: Number, required: true, min: 0 }, // Naira, as charged
//   },
//   { _id: false },
// );

// const paymentOrderSchema = new mongoose.Schema(
//   {
//     reference: { type: String, required: true, unique: true, index: true },
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     // Customer details captured on the checkout form (guest checkout).
//     customerName: { type: String, required: true, trim: true },
//     customerEmail: {
//       type: String,
//       required: true,
//       lowercase: true,
//       trim: true,
//       index: true,
//     },
//     customerPhone: { type: String, required: true, trim: true },

//     items: {
//       type: [orderItemSchema],
//       validate: [(v) => v.length > 0, "An order needs at least one course."],
//     },

//     amountNaira: { type: Number, required: true, min: 0 },
//     amountKobo: { type: Number, required: true, min: 0 },
//     currency: { type: String, default: "NGN", uppercase: true },
//     method: { type: String, enum: ["card", "transfer"], default: "card" },

//     status: {
//       type: String,
//       enum: ["pending", "paid", "failed"],
//       default: "pending",
//       index: true,
//     },
//     authorizationUrl: { type: String },

//     // Filled in once Paystack confirms the payment.
//     paidAt: { type: Date },
//     paystackTransactionId: { type: String },
//     paystackChannel: { type: String },
//     gatewayResponse: { type: String },
//     verificationPayload: { type: mongoose.Schema.Types.Mixed },
//   },
//   { timestamps: true },
// );

// export default mongoose.models.PaymentOrder ||
//   mongoose.model("PaymentOrder", paymentOrderSchema);

import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }, // Naira: the course's list price
    discount: { type: Number, default: 0, min: 0 }, // Naira taken off by a coupon
  },
  { _id: false },
);

const paymentOrderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Customer details captured on the checkout form (guest checkout).
    customerName: { type: String, required: true, trim: true },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    customerPhone: { type: String, required: true, trim: true },

    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, "An order needs at least one course."],
    },

    // subtotalNaira - discountNaira = amountNaira (what is actually charged)
    subtotalNaira: { type: Number, min: 0 },
    discountNaira: { type: Number, default: 0, min: 0 },
    // A copy of the coupon as it was when the order was placed
    coupon: {
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
      code: { type: String },
      discountType: { type: String },
      discountValue: { type: Number },
    },

    amountNaira: { type: Number, required: true, min: 0 },
    amountKobo: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN", uppercase: true },
    // "coupon" = a coupon covered the whole price, so nothing was charged
    method: {
      type: String,
      enum: ["card", "transfer", "coupon"],
      default: "card",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },
    authorizationUrl: { type: String },

    // Filled in once Paystack confirms the payment.
    paidAt: { type: Date },
    paystackTransactionId: { type: String },
    paystackChannel: { type: String },
    gatewayResponse: { type: String },
    verificationPayload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

paymentOrderSchema.index({ "coupon.couponId": 1, status: 1 });

export default mongoose.models.PaymentOrder ||
  mongoose.model("PaymentOrder", paymentOrderSchema);
