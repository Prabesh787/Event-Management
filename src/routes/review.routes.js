import express from "express";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";
import {
  createReview,
  getReviewsByEvent,
  getMyReviews,
  updateReview,
  deleteReview,
} from "../controllers/review/review.controller.js";

const router = express.Router();

// Public: anyone can view reviews for an event
router.get("/event/:eventId", getReviewsByEvent);

// Auth required: create review (attendees only enforced in controller)
router.post("/", verifyTokenMiddleware, createReview);

// Auth required: current user's reviews
router.get("/mine", verifyTokenMiddleware, getMyReviews);

// Auth required: update/delete own review
router.patch("/:id", verifyTokenMiddleware, updateReview);
router.delete("/:id", verifyTokenMiddleware, deleteReview);

export default router;
