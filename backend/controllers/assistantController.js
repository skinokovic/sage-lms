import asyncHandler from "express-async-handler";
import {
  askAssistant,
  assistantConfigured,
  normalizeHistory,
} from "../services/assistantService.js";

// A simple site-wide daily ceiling so a bug or an abuser can't run up a bill.
// (Held in memory: it resets if the server restarts.)
const usage = { day: "", count: 0 };

const withinDailyLimit = () => {
  const today = new Date().toISOString().slice(0, 10);
  if (usage.day !== today) {
    usage.day = today;
    usage.count = 0;
  }

  const limit = Number(process.env.ASSISTANT_DAILY_LIMIT) || 300;
  if (usage.count >= limit) return false;

  usage.count += 1;
  return true;
};

// @desc    Ask the visitor assistant a question
// @route   POST /api/assistant/chat
// @access  Public (rate limited)
const chat = asyncHandler(async (req, res) => {
  if (!assistantConfigured()) {
    res.status(503);
    throw new Error(
      "The assistant isn’t available right now. Please use the Contact page.",
    );
  }

  const history = normalizeHistory(req.body?.messages);
  if (!history) {
    res.status(400);
    throw new Error("Please type a question for the assistant.");
  }

  if (!withinDailyLimit()) {
    res.status(429);
    throw new Error(
      "The assistant has reached its daily limit. Please try again tomorrow or use the Contact page.",
    );
  }

  let reply;
  try {
    reply = await askAssistant(history);
  } catch (err) {
    // Log what went wrong (status + message), never the visitor's text
    console.error("[assistant] request failed:", err.status || "", err.message);
    res.status(503);
    throw new Error(
      "The assistant is busy right now. Please try again in a moment.",
    );
  }

  res.json({ success: true, reply });
});

export { chat };
