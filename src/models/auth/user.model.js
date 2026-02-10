import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ["ADMIN", "STUDENT"],
      default: "STUDENT",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    firstTimeLogin: {
      type: Boolean,
      default: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    profilePic: String,
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
