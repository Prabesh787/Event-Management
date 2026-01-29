import mongoose from "mongoose";
import { SEAT_STATUS } from "../enums.js";

const seatSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    seatNumber: { type: String, required: true }, // A1, B2
    row: String,
    section: String,

    price: Number,

    status: {
      type: String,
      enum: Object.values(SEAT_STATUS),
      default: SEAT_STATUS.AVAILABLE,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Seat", seatSchema);
