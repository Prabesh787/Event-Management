import mongoose from "mongoose";

const registerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    status: {
      type: String,
      enum: ["REGISTERED", "CANCELLED"],
      default: "REGISTERED",
    },

    /**
     * NEW: Dynamic registration data.
     * Use a Map of Strings to store flexible event-specific answers 
     * (e.g., dietaryNotes: "Vegan", tShirtSize: "XL").
     */
    additionalInfo: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

// Ensure a student can only register once per event
registerSchema.index({ user: 1, event: 1 }, { unique: true });

export default mongoose.model("Register", registerSchema);