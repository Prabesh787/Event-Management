import express from "express";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";
import { isSystemAdmin } from "../middleware/isSystemAdmin.js";
import {
  applyForInstitution,
  getMyInstitution,
  listInstitutions,
  getInstitutionById,
  updateInstitutionStatus,
} from "../controllers/institution/institution.controller.js";

const router = express.Router();

// Student / user: apply to register an institution
router.post("/apply", verifyTokenMiddleware, applyForInstitution);

// User: view own institution application (if any)
router.get("/mine", verifyTokenMiddleware, getMyInstitution);

// System admin: list / manage institutions
router.get("/", verifyTokenMiddleware, isSystemAdmin, listInstitutions);
router.get("/:id", verifyTokenMiddleware, isSystemAdmin, getInstitutionById);
router.patch(
  "/:id/status",
  verifyTokenMiddleware,
  isSystemAdmin,
  updateInstitutionStatus,
);

export default router;

