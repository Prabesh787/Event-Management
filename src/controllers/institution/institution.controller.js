import Institution from "../../models/institution/institution.model.js";
import { User } from "../../models/auth/user.model.js";
import { INSTITUTION_STATUS, USER_ROLE } from "../../models/enum.js";

/**
 * Student (or any logged-in user) applies to register an institution.
 * This will create a PENDING_VERIFICATION institution tied to the current user.
 */
export const applyForInstitution = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      name,
      type,
      description,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
      website,
      contactEmail,
      contactPhone,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Institution name is required",
      });
    }

    const user = await User.findById(userId).select("role institution");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.role === USER_ROLE.INSTITUTION_ADMIN &&
      user.institution
    ) {
      return res.status(400).json({
        success: false,
        message: "You are already an institution admin",
      });
    }

    const institution = await Institution.create({
      name,
      type,
      description,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
      website,
      contactEmail,
      contactPhone,
      owner: userId,
      status: INSTITUTION_STATUS.PENDING_VERIFICATION,
    });

    return res.status(201).json({
      success: true,
      message:
        "Institution application submitted. A system admin will review and verify it.",
      institution,
    });
  } catch (error) {
    console.error("applyForInstitution error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get the institution record owned by the current user (if any).
 */
export const getMyInstitution = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    const institution = await Institution.findOne({ owner: userId });
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "No institution application found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      institution,
    });
  } catch (error) {
    console.error("getMyInstitution error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * System admin: list institutions (optionally filter by status).
 */
export const listInstitutions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && Object.values(INSTITUTION_STATUS).includes(status)) {
      filter.status = status;
    }

    const institutions = await Institution.find(filter)
      .populate("owner", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      institutions,
    });
  } catch (error) {
    console.error("listInstitutions error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * System admin: get a single institution by id.
 */
export const getInstitutionById = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = await Institution.findById(id).populate(
      "owner",
      "name email role",
    );

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    return res.status(200).json({
      success: true,
      institution,
    });
  } catch (error) {
    console.error("getInstitutionById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * System admin: update institution status (VERIFY or REJECT) and promote user role.
 */
export const updateInstitutionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verificationNotes } = req.body;

    if (!Object.values(INSTITUTION_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(
          INSTITUTION_STATUS,
        ).join(", ")}`,
      });
    }

    const institution = await Institution.findById(id);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    institution.status = status;
    if (verificationNotes !== undefined) {
      institution.verificationNotes = verificationNotes;
    }
    await institution.save();

    // When VERIFIED: promote owner to INSTITUTION_ADMIN and link institution
    if (status === INSTITUTION_STATUS.VERIFIED) {
      const owner = await User.findById(institution.owner);
      if (owner) {
        owner.role = USER_ROLE.INSTITUTION_ADMIN;
        owner.institution = institution._id;
        await owner.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Institution status updated to ${status}`,
      institution,
    });
  } catch (error) {
    console.error("updateInstitutionStatus error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

