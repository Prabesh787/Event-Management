import Register from "../../models/register/register.model.js";
import Event from "../../models/event/event.model.js";

// Student registers / enrolls into an event (no seat selection)
export const registerForEvent = async (req, res) => {
  try {
    const userId = req.userId;
    const { eventId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "eventId is required",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (event.status === "CANCELLED" || event.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "This event is not open for registration",
      });
    }

    // If event tracks capacity, ensure there are seats left
    if (
      typeof event.totalSeats === "number" &&
      typeof event.availableSeats === "number" &&
      event.availableSeats <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "This event is already full",
      });
    }

    // Prevent duplicate registration
    const existing = await Register.findOne({ user: userId, event: eventId });
    if (existing && existing.status === "REGISTERED") {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event",
      });
    }

    const registration = existing
      ? await Register.findByIdAndUpdate(
          existing._id,
          { status: "REGISTERED" },
          { new: true }
        )
      : await Register.create({ user: userId, event: eventId });

    // Update availableSeats if tracked
    if (typeof event.totalSeats === "number") {
      const currentAvailable =
        typeof event.availableSeats === "number"
          ? event.availableSeats
          : event.totalSeats;
      event.availableSeats = Math.max(0, currentAvailable - 1);
      await event.save();
    }

    const populated = await Register.findById(registration._id)
      .populate("event", "title startDate endDate location status")
      .populate("user", "name email");

    return res.status(201).json({
      success: true,
      message: "Registered for event successfully",
      registration: populated,
    });
  } catch (error) {
    console.error("registerForEvent error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// List registrations of the current student
export const getMyRegistrations = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    const registrations = await Register.find({ user: userId })
      .populate("event", "title startDate endDate location status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      registrations,
    });
  } catch (error) {
    console.error("getMyRegistrations error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin: list registrations for a given event
export const getRegistrationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "eventId is required",
      });
    }

    const registrations = await Register.find({ event: eventId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      registrations,
    });
  } catch (error) {
    console.error("getRegistrationsByEvent error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Student cancels their registration
export const cancelRegistration = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    const registration = await Register.findById(id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    if (registration.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this registration",
      });
    }

    if (registration.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Registration is already cancelled",
      });
    }

    registration.status = "CANCELLED";
    await registration.save();

    // Increase availableSeats if tracked
    const event = await Event.findById(registration.event);
    if (event && typeof event.totalSeats === "number") {
      const currentAvailable =
        typeof event.availableSeats === "number"
          ? event.availableSeats
          : event.totalSeats;
      event.availableSeats = currentAvailable + 1;
      await event.save();
    }

    return res.status(200).json({
      success: true,
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    console.error("cancelRegistration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

