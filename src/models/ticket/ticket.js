import mongoose from "mongoose";
import { TICKET_STATUS } from "../enums.js";

const ticketSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    ticketCode: {
      type: String,
      unique: true,
      required: true, // QR / UUID
    },

    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.ACTIVE,
    },

    usedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
