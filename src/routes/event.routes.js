import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
} from "../controllers/event/event.controller.js";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";

const router = express.Router();

router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.post("/", verifyTokenMiddleware, createEvent);
router.put("/:id", verifyTokenMiddleware, updateEvent);
router.delete("/:id", verifyTokenMiddleware, deleteEvent);
router.post("/:eventId/status", verifyTokenMiddleware, updateEventStatus);

export default router;
