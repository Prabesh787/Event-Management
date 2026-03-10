import { User } from "../models/auth/user.model.js";
import { USER_ROLE } from "../models/enum.js";

/**
 * Use after verifyTokenMiddleware.
 * Allows:
 * - INSTITUTION_ADMIN (for their institution)
 * - SYSTEM_ADMIN / legacy ADMIN (superuser)
 */
export const isInstitutionAdmin = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    const user = await User.findById(req.userId).select("role institution");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const { role } = user;

    if (
      role === USER_ROLE.INSTITUTION_ADMIN ||
      role === USER_ROLE.SYSTEM_ADMIN ||
      role === USER_ROLE.ADMIN
    ) {
      // Attach institution id (if any) for downstream handlers
      req.institutionId = user.institution?.toString?.() || null;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden - institution admin access required",
    });
  } catch (error) {
    console.error("isInstitutionAdmin middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

