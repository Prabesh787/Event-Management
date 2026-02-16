import express from "express";
import {
  createNotification,
  getMyNotifications,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markNotificationRead,
} from "../controllers/notification/notification.controller.js";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// Current user's notifications (must be before /:id)
router.get("/me", verifyTokenMiddleware, getMyNotifications);

// Admin: create custom notification and send to desired user(s)
router.post("/", verifyTokenMiddleware, isAdmin, createNotification);

// Admin: all notifications with user list
router.get(
  "/",
  verifyTokenMiddleware,
  isAdmin,
  getAllNotifications
);

// Single notification (owner or admin)
router.get("/:id", verifyTokenMiddleware, getNotificationById);

// Admin: edit notification
router.put(
  "/:id",
  verifyTokenMiddleware,
  isAdmin,
  updateNotification
);

// Delete: admin = hard delete, user = soft delete (remove from my list)
router.delete("/:id", verifyTokenMiddleware, deleteNotification);

// Mark as read for current user
router.patch("/:id/read", verifyTokenMiddleware, markNotificationRead);

export default router;
