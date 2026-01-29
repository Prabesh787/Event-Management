import mongoose from "mongoose";
import { EVENT_STATUS } from "../enums.js";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // if you have users
      required: true,
    },

    location: {
      venue: String,
      address: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    totalSeats: Number,
    availableSeats: Number,

    price: { type: Number, default: 0 },

    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
    },

    bannerImage: String,
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
