import mongoose from "mongoose";

const notificationStateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Everything newer than this is "unread"
    seenAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("NotificationState", notificationStateSchema);
