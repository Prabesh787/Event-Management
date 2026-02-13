import Event from "../../models/event/event.model.js";
import { EVENT_STATUS } from "../../models/enum.js";
import { getIO } from "../../config/socket.js";
import Notification from "../../models/notification/notification.model.js";

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
      bannerImage,
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
      bannerImage: bannerImage || undefined,
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
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "status" && !Object.values(EVENT_STATUS).includes(req.body[key])) continue;
        event[key] = req.body[key];
      }
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

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    if (event.organizer.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this event" });
    }
    await Event.findByIdAndDelete(req.params.id);
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
