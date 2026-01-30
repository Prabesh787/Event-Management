import { User } from "../models/auth/user.model.js";

/**
 * Use after verifyTokenMiddleware.
 * Ensures the authenticated user has role ADMIN; otherwise returns 403.
 */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    const user = await User.findById(req.userId).select("role");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden - admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("isAdmin middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
