import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import ContactMessage from "../models/ContactMessage.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Send a message from the Contact Us page
// @route   POST /api/contact
// @access  Public
const submitMessage = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const subject = String(req.body?.subject || "").trim();
  const message = String(req.body?.message || "").trim();

  if (name.length < 2 || name.length > 100) {
    res.status(400);
    throw new Error("Please enter your name.");
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    res.status(400);
    throw new Error("Please enter a valid email address.");
  }
  if (subject.length > 150) {
    res.status(400);
    throw new Error("The subject is too long (150 characters max).");
  }
  if (message.length < 10 || message.length > 3000) {
    res.status(400);
    throw new Error("Your message should be between 10 and 3000 characters.");
  }

  await ContactMessage.create({ name, email, subject, message });

  res.status(201).json({
    success: true,
    message: "Thanks for reaching out. We’ve received your message.",
  });
});

// @desc    List contact messages
// @route   GET /api/contact?page=&limit=&status=&search=
// @access  Private (admin)
const getMessages = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const query = {};
  if (["new", "read"].includes(req.query.status)) {
    query.status = req.query.status;
  }
  if (req.query.search?.trim()) {
    const pattern = new RegExp(escapeRegex(req.query.search.trim()), "i");
    query.$or = [{ name: pattern }, { email: pattern }, { subject: pattern }];
  }

  const [matching, messages, total, unread] = await Promise.all([
    ContactMessage.countDocuments(query),
    ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ContactMessage.countDocuments(),
    ContactMessage.countDocuments({ status: "new" }),
  ]);

  res.json({
    success: true,
    messages,
    pagination: {
      page,
      limit,
      total: matching,
      totalPages: Math.max(Math.ceil(matching / limit), 1),
    },
    stats: { total, unread },
  });
});

// @desc    Mark a message read/unread
// @route   PATCH /api/contact/:id
// @access  Private (admin)
const updateMessageStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404);
    throw new Error("Message not found");
  }
  if (!["new", "read"].includes(status)) {
    res.status(400);
    throw new Error("Status must be 'new' or 'read'.");
  }

  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true },
  );

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  res.json({ success: true, message });
});

// @desc    Delete a message
// @route   DELETE /api/contact/:id
// @access  Private (admin)
const deleteMessage = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404);
    throw new Error("Message not found");
  }

  const message = await ContactMessage.findByIdAndDelete(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  res.json({ success: true, message: "Message deleted" });
});

export { submitMessage, getMessages, updateMessageStatus, deleteMessage };
