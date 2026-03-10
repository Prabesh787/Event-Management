import { User } from "../models/auth/user.model.js";
import { USER_ROLE } from "../models/enum.js";

/**
 * Use after verifyTokenMiddleware.
 * Ensures the authenticated user is a system-level admin.
 * Accepts both legacy "ADMIN" and new USER_ROLE.SYSTEM_ADMIN.
 */
export const isSystemAdmin = async (req, res, next) => {
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

    const allowedRoles = [USER_ROLE.ADMIN, USER_ROLE.SYSTEM_ADMIN];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - system admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("isSystemAdmin middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

