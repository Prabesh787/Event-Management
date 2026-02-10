import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // email: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // password: {
    //   type: String,
    //   required: true,
    // },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
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

userSchema.index({ email: 1 });

export const User = mongoose.model("User", userSchema);
