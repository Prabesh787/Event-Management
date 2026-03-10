import { User } from "../models/auth/user.model.js";
import Institution from "../models/institution/institution.model.js";
import { INSTITUTION_STATUS } from "../models/enum.js";

/**
 * Ensures the authenticated user is linked to a VERIFIED institution.
 * SYSTEM_ADMIN can pass even without an institution, since they can act as any institution admin.
 */
export const requireVerifiedInstitution = async (req, res, next) => {
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

    // System admin can bypass institution check
    if (user.role === "ADMIN" || user.role === "SYSTEM_ADMIN") {
      return next();
    }

    if (!user.institution) {
      return res.status(403).json({
        success: false,
        message: "You must be associated with a verified institution to perform this action",
      });
    }

    const institution = await Institution.findById(user.institution).select(
      "status",
    );
    if (!institution) {
      return res.status(403).json({
        success: false,
        message: "Institution not found or no longer available",
      });
    }

    if (institution.status !== INSTITUTION_STATUS.VERIFIED) {
      return res.status(403).json({
        success: false,
        message: "Institution is not verified yet",
      });
    }

    // Expose for downstream handlers if needed
    req.institutionId = institution._id.toString();
    next();
  } catch (error) {
    console.error("requireVerifiedInstitution middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

