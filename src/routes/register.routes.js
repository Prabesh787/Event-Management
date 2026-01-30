import express from "express";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";
import { isAdmin } from "../middleware/isAdmin.js";
import {
  registerForEvent,
  getMyRegistrations,
  getRegistrationsByEvent,
  cancelRegistration,
} from "../controllers/register/register.controller.js";

const router = express.Router();

// Student endpoints
router.post("/", verifyTokenMiddleware, registerForEvent);
router.get("/mine", verifyTokenMiddleware, getMyRegistrations);
router.delete("/:id", verifyTokenMiddleware, cancelRegistration);

// Admin endpoint
router.get("/event/:eventId", verifyTokenMiddleware, isAdmin, getRegistrationsByEvent);

export default router;

