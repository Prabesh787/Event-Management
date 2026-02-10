import crypto from "crypto";
import { generateTokenAndSetCookie } from "../../utils/generateTokenAndSendCookie.js";
import { User } from "../../models/auth/user.model.js";
import { client } from "../../utils/googleClient.js";

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body; // ID token from frontend

    if (!token) {
      return res.status(400).json({ success: false, message: "Token missing" });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "423512627428-ge7b6qmbkm6emofr4fukgoboptv0rpkc.apps.googleusercontent.com",
    });

    const { email, name, picture, email_verified } = ticket.getPayload();

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google email not verified",
      });
    }

    let user = await User.findOne({ email });

    //  If user does not exist → create
    if (!user) {
      user = await User.create({
        email,
        name,
        password: crypto.randomBytes(16).toString("hex"), // dummy password
        isVerified: true,
        authProvider: "google",
        profilePic: picture,
        firstTimeLogin: true,
      });
    }

    // If user exists but signed up with email/password before
    if (!user.authProvider) {
      user.authProvider = "google";
    }

    user.lastLogin = new Date();
    await user.save();

    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: "Google login successful",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("🚀 Google Auth Error:", error);
    res
      .status(400)
      .json({ success: false, message: "Google authentication failed" });
  }
};
