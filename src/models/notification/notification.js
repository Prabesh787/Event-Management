import mongoose from "mongoose";
import { NOTIFICATION_TYPE } from "../enums.js";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },

    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      required: true,
    },

    title: String,
    message: String,

    isRead: { type: Boolean, default: false },

    scheduledAt: Date, // for reminders
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
