import express from "express";
import {
  getAllEvents,
  getEventById,
  getEventsByInstitution,
  uploadEventBanner,
  patchEventBanner,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
} from "../controllers/event/event.controller.js";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";
import { uploadEventBanner as uploadEventBannerMiddleware } from "../middleware/uploadMiddleware.js";
import { requireVerifiedInstitution } from "../middleware/requireVerifiedInstitution.js";

const router = express.Router();

router.get("/", getAllEvents);
router.post(
  "/banner",
  verifyTokenMiddleware,
  uploadEventBannerMiddleware,
  uploadEventBanner
);
router.patch(
  "/:id/banner",
  verifyTokenMiddleware,
  uploadEventBannerMiddleware,
  patchEventBanner
);
router.get("/:id", getEventById);
router.get("/institution/:institutionId", verifyTokenMiddleware, getEventsByInstitution);
// Event creation and management require a verified institution (or system admin)
router.post(
  "/",
  verifyTokenMiddleware,
  requireVerifiedInstitution,
  createEvent
);
router.put(
  "/:id",
  verifyTokenMiddleware,
  requireVerifiedInstitution,
  updateEvent
);
router.delete(
  "/:id",
  verifyTokenMiddleware,
  requireVerifiedInstitution,
  deleteEvent
);
router.post(
  "/:eventId/status",
  verifyTokenMiddleware,
  requireVerifiedInstitution,
  updateEventStatus
);

export default router;
