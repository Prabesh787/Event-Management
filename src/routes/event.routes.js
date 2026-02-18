import express from "express";
import {
  getAllEvents,
  getEventById,
  uploadEventBanner,
  patchEventBanner,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
} from "../controllers/event/event.controller.js";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";
import { uploadEventBanner as uploadEventBannerMiddleware } from "../middleware/uploadMiddleware.js";

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
router.post("/", verifyTokenMiddleware, createEvent);
router.put("/:id", verifyTokenMiddleware, updateEvent);
router.delete("/:id", verifyTokenMiddleware, deleteEvent);
router.post("/:eventId/status", verifyTokenMiddleware, updateEventStatus);

export default router;
