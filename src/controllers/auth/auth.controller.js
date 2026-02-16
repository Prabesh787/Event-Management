import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { User } from "../../models/auth/user.model.js";
import { generateVerificationToken } from "../../utils/generateVerificationToken.js";
import { generateTokenAndSetCookie } from "../../utils/generateTokenAndSendCookie.js";
import { uploadUserProfileImage } from "../../utils/cloudinaryUpload.js";
import { isCloudinaryConfigured } from "../../config/cloudinary.js";
import {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../../mailtrap/emails.js";
import expressAsyncHandler from "express-async-handler";

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("🚀 ~ checkAuth ~ error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const signup = async (req, res) => {
  const { email, name, role, password } = req.body;

  try {
    if (!email || !name || !password) {
      throw new Error("All fields are required");
    }

    const userAlreadyExists = await User.findOne({ email });

    if (userAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const verificationToken = generateVerificationToken();

    const user = new User({
      email,
      password: hashedPassword,
      name,
      role,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    await user.save();

    generateTokenAndSetCookie(res, user._id);
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;

  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;

    await user.save();
    await sendWelcomeEmail(user.email, user.name);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    generateTokenAndSetCookie(res, user._id);
    user.lastLogin = new Date();

    const isFirstTimeLogin = user.firstTimeLogin;

    if (isFirstTimeLogin) {
      user.firstTimeLogin = false;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.error("🚀 ~ Error login ~ error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    //Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; //1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();

    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/#/auth/reset-password/${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Password reset link send to your email",
    });
  } catch (error) {
    console.log("🚀 ~ forgotPassword ~ error:", error);
    res.status(400).json({
      success: false,
      message: error.messgae,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });
    console.log("🚀 ~ resetPassword ~ user:", user);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    await sendResetSuccessEmail(user.email);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.log("🚀 ~ resetPassword ~ error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const allUsers = expressAsyncHandler(async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(keyword).find({
      _id: { $ne: req.userId }, // FIXED
    }).select("-password"); // recommended

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("🚀 ~ allUsers ~ error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

/**
 * PATCH /api/user/profile-picture
 * Upload profile image to Cloudinary (eventManagement/user/[user_name]) and update user.
 * Body: multipart with "profilePic" file, OR JSON with { profilePic: "data:image/...;base64,..." }
 */
export const updateProfilePicture = async (req, res) => {
  try {
    const source = req.file || (req.body && req.body.profilePic) || null;
    if (!source) {
      return res.status(400).json({
        success: false,
        message: "Provide profilePic as file (multipart) or base64 (JSON)",
      });
    }

    if (!isCloudinaryConfigured()) {
      const missing = [];
      if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push("CLOUDINARY_CLOUD_NAME");
      if (!process.env.CLOUDINARY_API_KEY) missing.push("CLOUDINARY_API_KEY");
      if (!process.env.CLOUDINARY_API_SECRET) missing.push("CLOUDINARY_API_SECRET");
      return res.status(503).json({
        success: false,
        message: `Cloudinary not configured. Missing: ${missing.join(", ") || "env vars not loaded (restart server)"}`,
      });
    }

    const user = await User.findById(req.userId).select("name");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const result = await uploadUserProfileImage(user.name, source);
    if (!result || !result.url) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image",
      });
    }

    await User.findByIdAndUpdate(req.userId, { profilePic: result.url });
    const updated = await User.findById(req.userId).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile picture updated",
      user: updated,
    });
  } catch (error) {
    console.error("updateProfilePicture error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

