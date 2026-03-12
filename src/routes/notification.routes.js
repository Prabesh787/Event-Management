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
import { isInstitutionAdmin } from "../middleware/isInstitutionAdmin.js"; 
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// Current user's notifications (must be before /:id)
router.get("/me", verifyTokenMiddleware, getMyNotifications);

// Admin: create custom notification and send to desired user(s)
router.post("/", verifyTokenMiddleware, isInstitutionAdmin, createNotification);

// Admin: all notifications with user list
router.get(
  "/",
  verifyTokenMiddleware,
  isInstitutionAdmin,
  getAllNotifications
);

// Single notification (owner or admin)
router.get("/:id", verifyTokenMiddleware, getNotificationById);

// Admin: edit notification
router.put(
  "/:id",
  verifyTokenMiddleware,
  isInstitutionAdmin,  
  updateNotification
);

// Delete: admin = hard delete, user = soft delete (remove from my list)
router.delete("/:id", verifyTokenMiddleware, isInstitutionAdmin, deleteNotification);

// Mark as read for current user
router.patch("/:id/read", verifyTokenMiddleware, markNotificationRead);

export default router;
