import mongoose from "mongoose";
import { INSTITUTION_STATUS } from "../enum.js";

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["COLLEGE", "UNIVERSITY", "SCHOOL", "TRAINING_CENTER", "OTHER"],
      default: "COLLEGE",
    },
    description: { type: String },

    // Basic location / contact info
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String },
    website: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },

    /**
     * The user who applied / owns this institution.
     * On verification, this user will become INSTITUTION_ADMIN.
     */
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(INSTITUTION_STATUS),
      default: INSTITUTION_STATUS.PENDING_VERIFICATION,
    },

    verificationNotes: { type: String },

    // Optional assets / documents (e.g. accreditation proof)
    logoUrl: { type: String },
    documents: [
      {
        label: String,
        url: String,
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Institution", institutionSchema);

