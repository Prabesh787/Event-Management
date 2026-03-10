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
      ref: "User",
      required: true,
    },

    /**
     * The institution that owns this event.
     * For legacy events created before multi-vendor, this can be null.
     */
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      default: null,
      index: true,
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
        label: { type: String, required: true },
        name: { type: String, required: true },
        fieldType: {
          type: String,
          enum: ["text", "number", "select", "checkbox"],
          default: "text",
        },
        options: [String],
        required: { type: Boolean, default: false },
      },
    ],

    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
    },

    /**
     * Event banner stored in Cloudinary.
     * Folder: eventManagement/events/[event_name]
     */
    bannerImage: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Event", eventSchema);
