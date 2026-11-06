import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Subscriber from "../models/Subscriber.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Subscribe an email to the newsletter
// @route   POST /api/subscribers
// @access  Public
const subscribe = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address.");
  }

  const message = "Thanks — you’re subscribed!";

  const existing = await Subscriber.findOne({ email }).select("_id").lean();
  if (existing) return res.json({ success: true, message });

  try {
    await Subscriber.create({ email, source: "footer" });
  } catch (err) {
    // Two identical requests at once: the unique index rejects the second.
    if (err.code !== 11000) throw err;
  }

  res.status(201).json({ success: true, message });
});

// @desc    List subscribers
// @route   GET /api/subscribers?page=&limit=&search=
// @access  Private (admin)
const getSubscribers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 100);

  const query = {};
  if (req.query.search?.trim()) {
    query.email = {
      $regex: escapeRegex(req.query.search.trim()),
      $options: "i",
    };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [matching, subscribers, total, thisMonth] = await Promise.all([
    Subscriber.countDocuments(query),
    Subscriber.find(query)
      .sort({ subscribedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Subscriber.countDocuments(),
    Subscriber.countDocuments({ subscribedAt: { $gte: monthStart } }),
  ]);

  res.json({
    success: true,
    subscribers,
    pagination: {
      page,
      limit,
      total: matching,
      totalPages: Math.max(Math.ceil(matching / limit), 1),
    },
    stats: { total, thisMonth },
  });
});

// @desc    Remove a subscriber
// @route   DELETE /api/subscribers/:id
// @access  Private (admin)
const deleteSubscriber = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404);
    throw new Error("Subscriber not found");
  }

  const subscriber = await Subscriber.findByIdAndDelete(req.params.id);

  if (!subscriber) {
    res.status(404);
    throw new Error("Subscriber not found");
  }

  res.json({ success: true, message: "Subscriber removed" });
});

export { subscribe, getSubscribers, deleteSubscriber };
