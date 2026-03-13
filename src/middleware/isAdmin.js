import { User } from "../models/auth/user.model.js";
import { USER_ROLE } from "../models/enum.js";

/**
 * Legacy admin middleware.
 * Now treats both ADMIN and SYSTEM_ADMIN as "admin".
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

    const allowedRoles = [USER_ROLE.ADMIN, USER_ROLE.SYSTEM_ADMIN, USER_ROLE.INSTITUTION_ADMIN];

    if (!allowedRoles.includes(user.role)) {
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
