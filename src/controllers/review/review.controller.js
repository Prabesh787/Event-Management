import Review from "../../models/review/review.js";
import Register from "../../models/register/register.model.js";
import Event from "../../models/event/event.model.js";

/**
 * Create a review for an event.
 * Allowed only for authenticated users who are registered attendees of the event,
 * and only after the event has ended.
 */
export const createReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { eventId, rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    if (!eventId || rating == null) {
      return res.status(400).json({
        success: false,
        message: "eventId and rating are required",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const now = new Date();
    if (event.endDate > now) {
      return res.status(400).json({
        success: false,
        message: "You can review only after the event has ended",
      });
    }

    const registration = await Register.findOne({
      event: eventId,
      user: userId,
      status: "REGISTERED",
    });
    if (!registration) {
      return res.status(403).json({
        success: false,
        message: "Only registered attendees of this event can submit a review",
      });
    }

    const existingReview = await Review.findOne({ event: eventId, user: userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this event",
      });
    }

    const review = await Review.create({
      event: eventId,
      user: userId,
      rating: Number(rating),
      comment: comment || "",
    });

    const populated = await Review.findById(review._id)
      .populate("user", "name email profilePicture")
      .populate("event", "title endDate");

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: populated,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message || "Invalid review data",
      });
    }
    console.error("createReview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create review",
    });
  }
};

/**
 * Get all reviews for an event. Public - no auth required.
 */
export const getReviewsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const reviews = await Review.find({ event: eventId })
      .populate("user", "name email profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("getReviewsByEvent error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

/**
 * Get current user's reviews. Auth required.
 */
export const getMyReviews = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    const reviews = await Review.find({ user: userId })
      .populate("event", "title startDate endDate")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("getMyReviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your reviews",
    });
  }
};

/**
 * Update own review. Only the review author can update.
 */
export const updateReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own review",
      });
    }

    if (rating != null) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment;
    await review.save();

    const populated = await Review.findById(review._id)
      .populate("user", "name email profilePicture")
      .populate("event", "title endDate");

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review: populated,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message || "Invalid review data",
      });
    }
    console.error("updateReview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
};

/**
 * Delete own review. Only the review author can delete.
 */
export const deleteReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - authentication required",
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review",
      });
    }

    await Review.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("deleteReview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};
