import Event from "../../models/event/event.model.js";
import { EVENT_STATUS } from "../../models/enum.js";
import { getIO } from "../../config/socket.js";
import Notification from "../../models/notification/notification.model.js";
import {
  deleteByPublicId,
  uploadEventBannerImage,
} from "../../utils/cloudinaryUpload.js";

export const getAllEvents = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const events = await Event.find(filter)
      .populate("category", "name description")
      .populate("organizer", "name email")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Event.countDocuments(filter);
    res.status(200).json({
      success: true,
      events,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("category", "name description")
      .populate("organizer", "name email");
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      startDate,
      endDate,
      totalSeats,
      price,
      status,
      bannerImage, // preferred: { url, publicId }
      bannerUrl, // backward compat: string URL
      registrationStartDate,
      registrationEndDate,
      registrationFields, // NEW: Added to capture dynamic form blueprint
    } = req.body;

    // 1. Mandatory field validation
    if (!title || !category || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, category, startDate and endDate are required",
      });
    }

    const availableSeats = totalSeats != null ? Number(totalSeats) : undefined;

    // Upload-first flow:
    // - Frontend uploads banner via POST /api/events/banner and gets { bannerUrl, publicId }
    // - Then sends bannerImage: { url, publicId } (or bannerUrl for legacy clients).
    let resolvedBannerImage = undefined;
    if (bannerImage && typeof bannerImage === "object" && bannerImage.url) {
      resolvedBannerImage = {
        url: bannerImage.url,
        publicId: bannerImage.publicId,
      };
    } else if (typeof bannerUrl === "string" && bannerUrl) {
      resolvedBannerImage = { url: bannerUrl };
    } else if (typeof bannerImage === "string" && bannerImage) {
      // backward compatibility: if client still sends bannerImage as URL, store it.
      // (If it's base64, we still upload to avoid breaking old clients.)
      if (bannerImage.startsWith("data:")) {
        const result = await uploadEventBannerImage(title, bannerImage);
        if (result?.url) resolvedBannerImage = { url: result.url, publicId: result.publicId };
      } else {
        resolvedBannerImage = { url: bannerImage };
      }
    }

    // 2. Create the event document
    const event = await Event.create({
      title,
      description,
      category,
      organizer: req.userId,
      location: location || {},
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      totalSeats: availableSeats,
      availableSeats: availableSeats ?? 0,
      price: price != null ? Number(price) : 0,
      status: status && Object.values(EVENT_STATUS).includes(status) ? status : EVENT_STATUS.DRAFT,
      bannerImage: resolvedBannerImage,
      registrationFields: registrationFields || [], // NEW: Save the dynamic fields array
    });

    // 2. Save the BROADCAST Notification to DB
    // We save this so users can see it in their history later
    const notification = await Notification.create({
      title: 'New Event Alert!',
      message: `A new event "${title}" has been listed.`,
      category: 'NEW_EVENT',
      scope: 'BROADCAST',
      data: {
        eventId: event._id,
        action: 'OPEN_EVENT'
      }
    });

    // 3. Dispatch Real-Time Alert via Socket.io
    // Since it's a BROADCAST, we use io.emit to send to ALL connected clients
    const io = getIO();
    if (io) io.emit("receive_notification", {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      scope: notification.scope,
      data: notification.data,
      createdAt: notification.createdAt
    });

    // 3. Populate and return
    const populated = await Event.findById(event._id)
      .populate("category", "name description")
      .populate("organizer", "name email");

    res.status(201).json({ success: true, event: populated });
  } catch (error) {
    console.error("createEvent error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Not authorized to update this event" });
    }

    const allowed = [
      "title",
      "description",
      "category",
      "location",
      "startDate",
      "endDate",
      "registrationStartDate",
      "registrationEndDate",
      "totalSeats",
      "availableSeats",
      "price",
      "status",
      "bannerImage",
      "bannerUrl",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "status" && !Object.values(EVENT_STATUS).includes(req.body[key])) continue;
        // bannerUrl is legacy; map it into bannerImage.url
        if (key === "bannerUrl") {
          event.bannerImage = {
            url: req.body.bannerUrl,
            publicId: event.bannerImage?.publicId,
          };
          continue;
        }
        // if client sends bannerImage as an object { url, publicId }, accept it
        if (key === "bannerImage" && typeof req.body.bannerImage === "object" && req.body.bannerImage?.url) {
          event.bannerImage = {
            url: req.body.bannerImage.url,
            publicId: req.body.bannerImage.publicId,
          };
          continue;
        }
        event[key] = req.body[key];
      }
    }
    // Backward compatibility: if bannerImage is base64 string, upload and store { url, publicId }
    if (typeof req.body.bannerImage === "string" && req.body.bannerImage.startsWith("data:")) {
      const result = await uploadEventBannerImage(event.title, req.body.bannerImage);
      if (result?.url) event.bannerImage = { url: result.url, publicId: result.publicId };
    }
    await event.save();

    const populated = await Event.findById(event._id)
      .populate("category", "name description")
      .populate("organizer", "name email");
    res.status(200).json({ success: true, event: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/events/banner
 * Upload an event banner to Cloudinary under eventManagement/events/[event_name].
 *
 * multipart/form-data:
 * - bannerImage: File (required)
 * - eventName: string (required)
 */
export const uploadEventBanner = async (req, res) => {
  try {
    const file = req.file;
    const { eventName } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: "bannerImage file is required" });
    }
    if (!eventName) {
      return res.status(400).json({ success: false, message: "eventName is required" });
    }

    const result = await uploadEventBannerImage(eventName, file);
    if (!result?.url) {
      return res.status(500).json({ success: false, message: "Failed to upload banner image" });
    }

    return res.status(201).json({
      success: true,
      bannerUrl: result.url,
      publicId: result.publicId,
      bannerImage: { url: result.url, publicId: result.publicId },
    });
  } catch (error) {
    console.error("uploadEventBanner error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/events/:id/banner
 * Upload a new banner for an existing event and update event.bannerImage { url, publicId }.
 *
 * multipart/form-data:
 * - bannerImage: File (required)
 */
export const patchEventBanner = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "bannerImage file is required" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Not authorized to update this event" });
    }

    const oldPublicId = event.bannerImage?.publicId;

    const result = await uploadEventBannerImage(event.title, file);
    if (!result?.url) {
      return res.status(500).json({ success: false, message: "Failed to upload banner image" });
    }

    event.bannerImage = { url: result.url, publicId: result.publicId };
    await event.save();

    // Best-effort cleanup of old banner (don’t fail request if this fails)
    if (oldPublicId && oldPublicId !== result.publicId) {
      await deleteByPublicId(oldPublicId);
    }

    const populated = await Event.findById(event._id)
      .populate("category", "name description")
      .populate("organizer", "name email");

    return res.status(200).json({
      success: true,
      message: "Banner updated",
      event: populated,
      bannerImage: event.bannerImage,
    });
  } catch (error) {
    console.error("patchEventBanner error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this event" });
    }

    // Best-effort: delete Cloudinary banner if present
    const bannerPublicId = event.bannerImage?.publicId;

    await Event.findByIdAndDelete(req.params.id);

    if (bannerPublicId) {
      try {
        await deleteByPublicId(bannerPublicId);
      } catch (e) {
        console.warn("Failed to delete Cloudinary banner:", e?.message || e);
      }
    }

    res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @EventManagementBackend/src/controllers/event/event.controller.js

export const updateEventStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    // 1. Define valid status transitions
    const validStatuses = ["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // 2. Find and update the event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }

    // 3. Optional: Add business logic guards
    // Example: Don't allow changing status if the event is already COMPLETED
    if (event.status === "COMPLETED" && status !== "COMPLETED") {
       return res.status(400).json({
         success: false,
         message: "Cannot change the status of a completed event",
       });
    }

    event.status = status;
    await event.save();

    return res.status(200).json({
      success: true,
      message: `Event status updated to ${status}`,
      event,
    });
  } catch (error) {
    console.error("updateEventStatus error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
