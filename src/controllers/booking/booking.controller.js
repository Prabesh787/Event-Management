import Booking from "../../models/booking/booking.model.js";
import Event from "../../models/event/event.model.js";
import Seat from "../../models/seat/seat.js";
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SEAT_STATUS,
} from "../../models/enum.js";

// Create a booking for available seats in an event
export const createBooking = async (req, res) => {
  try {
    const userId = req.userId; // set by verifyTokenMiddleware
    const { eventId, seatIds = [], totalAmount } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "eventId and at least one seatId are required",
      });
    }

    // Check that the event exists and is open for booking
    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (event.status === "CANCELLED" || event.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "This event is not open for booking",
      });
    }

    // Find seats that are available for this event
    const seats = await Seat.find({
      _id: { $in: seatIds },
      event: eventId,
      status: SEAT_STATUS.AVAILABLE,
    });

    if (seats.length !== seatIds.length) {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected seats are not available for this event anymore",
      });
    }

    // Compute total amount if not provided: use seat.price or event.price
    let computedAmount = totalAmount;
    if (computedAmount == null) {
      const sumSeatPrices = seats.reduce(
        (sum, seat) => sum + (seat.price || 0),
        0
      );
      computedAmount =
        sumSeatPrices > 0
          ? sumSeatPrices
          : (event.price || 0) * seats.length;
    }

    // Create booking in CONFIRMED/UNPAID state
    const booking = await Booking.create({
      user: userId,
      event: eventId,
      seats: seatIds,
      totalAmount: computedAmount,
      bookingStatus: BOOKING_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.UNPAID,
    });

    // Mark seats as BOOKED
    await Seat.updateMany(
      { _id: { $in: seatIds } },
      { status: SEAT_STATUS.BOOKED }
    );

    // Update event availableSeats if tracked
    if (typeof event.totalSeats === "number") {
      const currentAvailable =
        typeof event.availableSeats === "number"
          ? event.availableSeats
          : event.totalSeats;
      event.availableSeats = Math.max(0, currentAvailable - seats.length);
      await event.save();
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("event", "title startDate endDate location")
      .populate("user", "name email")
      .populate("seats", "seatNumber row section price");

    return res.status(201).json({
      success: true,
      message: "Seats booked successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("createBooking error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

