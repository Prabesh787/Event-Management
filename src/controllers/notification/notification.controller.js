import Notification from "../../models/notification/notification.model.js";
import { getIO } from "../../config/socket.js";

/**
 * POST /api/notifications
 * Create a custom notification and send to desired user(s) (admin only).
 * Body: title, message, category, scope, data?, recipientId? (single), userIds? (array for multiple).
 * - BROADCAST: no recipient needed; all users see it.
 * - TARGETED: use recipientId (single user).
 * - PERSONALIZED: use userIds (array); stored in allowedUsers.
 */
export const createNotification = async (req, res) => {
  try {
    const { title, message, category, scope, data, recipientId, userIds } =
      req.body;

    if (!title || !message || !category || !scope) {
      return res.status(400).json({
        success: false,
        message: "Title, message, category and scope are required",
      });
    }

    const validCategories = [
      "NEW_EVENT",
      "EVENT_REMINDER",
      "EVENT_UPDATED",
      "SYSTEM",
    ];
    const validScopes = ["BROADCAST", "TARGETED", "PERSONALIZED"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(", ")}`,
      });
    }
    if (!validScopes.includes(scope)) {
      return res.status(400).json({
        success: false,
        message: `Scope must be one of: ${validScopes.join(", ")}`,
      });
    }

    let recipient = null;
    let allowedUsers = [];

    if (scope === "TARGETED") {
      if (!recipientId) {
        return res.status(400).json({
          success: false,
          message: "recipientId is required for TARGETED scope",
        });
      }
      recipient = recipientId;
    } else if (scope === "PERSONALIZED") {
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "userIds (non-empty array) is required for PERSONALIZED scope",
        });
      }
      allowedUsers = userIds;
    }

    const notification = await Notification.create({
      title,
      message,
      category,
      scope,
      data: data || {},
      recipient: recipient || undefined,
      allowedUsers: allowedUsers.length ? allowedUsers : undefined,
    });

    const populated = await Notification.findById(notification._id)
      .populate("recipient", "name email")
      .populate("allowedUsers", "name email")
      .populate("data.eventId", "title startDate")
      .lean();

    // Plain object so Socket.IO serializes cleanly (ObjectId/Date → string)
    const payload = {
      _id: populated._id?.toString?.() ?? populated._id,
      title: populated.title,
      message: populated.message,
      category: populated.category,
      scope: populated.scope,
      data: populated.data
        ? {
            eventId: populated.data.eventId?._id?.toString?.() ?? populated.data.eventId,
            externalLink: populated.data.externalLink,
            action: populated.data.action,
          }
        : {},
      createdAt:
        populated.createdAt instanceof Date
          ? populated.createdAt.toISOString()
          : populated.createdAt,
    };

    const io = getIO();
    if (io) {
      if (scope === "BROADCAST") {
        io.emit("receive_notification", payload);
        console.log("[Notification] Emitted BROADCAST receive_notification to all clients");
      } else {
        const targetIds = scope === "TARGETED" ? [recipient] : allowedUsers;
        targetIds.forEach((id) => {
          const room = id?.toString?.() || id;
          io.to(room).emit("receive_notification", payload);
        });
        console.log("[Notification] Emitted receive_notification to rooms:", targetIds);
      }
    } else {
      console.warn("[Notification] Socket.IO not available, skip real-time emit");
    }

    res.status(201).json({
      success: true,
      message: "Notification created and sent",
      notification: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/notifications/me
 * Fetch notifications for the current user (auth required).
 * Returns notifications where user is recipient, in allowedUsers, or scope is BROADCAST.
 * Excludes notifications where user is in deletedBy.
 */
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {
      $and: [
        { deletedBy: { $ne: userId } },
        {
          $or: [
            { recipient: userId },
            { allowedUsers: userId },
            { scope: "BROADCAST" },
          ],
        },
      ],
    };

    if (unreadOnly === "true") {
      filter.readBy = { $ne: userId };
    }

    const notifications = await Notification.find(filter)
      .populate("data.eventId", "title startDate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Notification.countDocuments(filter);

    const withReadFlag = notifications.map((n) => ({
      ...n,
      read: n.readBy && n.readBy.some((id) => id.toString() === userId),
    }));

    res.status(200).json({
      success: true,
      notifications: withReadFlag,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/notifications
 * List all notifications with user list (admin only).
 */
export const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, scope } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (category) filter.category = category;
    if (scope) filter.scope = scope;

    const notifications = await Notification.find(filter)
      .populate("recipient", "name email")
      .populate("allowedUsers", "name email")
      .populate("data.eventId", "title startDate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      notifications,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/notifications/:id
 * Get a single notification by id (admin or recipient/allowed user).
 */
export const getNotificationById = async (req, res) => {
  try {
    const userId = req.userId;
    const notification = await Notification.findById(req.params.id)
      .populate("recipient", "name email")
      .populate("allowedUsers", "name email")
      .populate("data.eventId", "title startDate");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const isRecipient =
      notification.recipient &&
      notification.recipient._id.toString() === userId;
    const isAllowed =
      notification.allowedUsers &&
      notification.allowedUsers.some((u) => u._id.toString() === userId);
    const isBroadcast = notification.scope === "BROADCAST";
    const canAccess =
      isRecipient || isAllowed || (isBroadcast && userId);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this notification",
      });
    }

    if (notification.deletedBy?.some((id) => id.toString() === userId)) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const payload = notification.toObject ? notification.toObject() : notification;
    payload.read = notification.readBy?.some((id) => id.toString() === userId);

    res.status(200).json({ success: true, notification: payload });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/notifications/:id
 * Edit notification (admin only).
 */
export const updateNotification = async (req, res) => {
  try {
    const { title, message, category, scope, data } = req.body;

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (title !== undefined) notification.title = title;
    if (message !== undefined) notification.message = message;
    if (category !== undefined) notification.category = category;
    if (scope !== undefined) notification.scope = scope;
    if (data !== undefined) {
      notification.data = { ...notification.data, ...data };
    }

    await notification.save();

    const populated = await Notification.findById(notification._id)
      .populate("recipient", "name email")
      .populate("allowedUsers", "name email")
      .populate("data.eventId", "title startDate");

    res.status(200).json({
      success: true,
      message: "Notification updated",
      notification: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete notification. Admin: hard delete. User: soft delete (add to deletedBy).
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const { User } = await import("../../models/auth/user.model.js");
    const user = await User.findById(userId).select("role").lean();
    const isAdmin = user?.role === "ADMIN";

    if (isAdmin) {
      await Notification.findByIdAndDelete(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Notification deleted",
      });
    }

    const isRecipient =
      notification.recipient &&
      notification.recipient.toString() === userId;
    const isAllowed =
      notification.allowedUsers &&
      notification.allowedUsers.some((id) => id.toString() === userId);
    const isBroadcast = notification.scope === "BROADCAST";
    const isOwner = isRecipient || isAllowed || isBroadcast;

    if (isOwner) {
      if (!notification.deletedBy) notification.deletedBy = [];
      if (!notification.deletedBy.some((id) => id.toString() === userId)) {
        notification.deletedBy.push(userId);
        await notification.save();
      }
      return res.status(200).json({
        success: true,
        message: "Notification removed from your list",
      });
    }

    return res.status(403).json({
      success: false,
      message: "You cannot delete this notification",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read for the current user.
 */
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.userId;
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!notification.readBy) notification.readBy = [];
    if (!notification.readBy.some((id) => id.toString() === userId)) {
      notification.readBy.push(userId);
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: "Marked as read",
      notification: await Notification.findById(notification._id)
        .populate("data.eventId", "title startDate")
        .lean(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
