import Event from "../../models/event/event.model.js";
import { EVENT_STATUS } from "../../models/enum.js";

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
    } = req.body;

    if (!title || !category || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, category, startDate and endDate are required",
      });
    }

    const availableSeats =
      totalSeats != null ? Number(totalSeats) : undefined;
    const event = await Event.create({
      title,
      description,
      category,
      organizer: req.userId,
      location: location || {},
      startDate,
      endDate,
      totalSeats: availableSeats,
      availableSeats: availableSeats ?? 0,
      price: price != null ? Number(price) : 0,
      status: status && Object.values(EVENT_STATUS).includes(status) ? status : EVENT_STATUS.DRAFT,
      bannerImage: bannerImage || undefined,
    });

    const populated = await Event.findById(event._id)
      .populate("category", "name description")
      .populate("organizer", "name email");
    res.status(201).json({ success: true, event: populated });
  } catch (error) {
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
