import mongoose from "mongoose";
import { EVENT_STATUS } from "../enum.js";

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

    registrationStartDate: { type: Date }, 
    registrationEndDate: { type: Date },

    totalSeats: Number,
    availableSeats: Number,

    price: { type: Number, default: 0 },
    
    registrationFields: [
      {
        label: { type: String, required: true }, // e.g., "T-Shirt Size"
        name: { type: String, required: true },  // e.g., "tShirtSize" (JSON key)
        fieldType: { 
          type: String, 
          enum: ["text", "number", "select", "checkbox"], 
          default: "text" 
        },
        options: [String], // Only used if fieldType is "select"
        required: { type: Boolean, default: false }
      }
    ],

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
