import express from "express";
import { createPayPalOrder, capturePayPalOrder } from "../controllers/payment/paypal.controller.js";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";

const router = express.Router();

// Create PayPal order
router.post("/create-order", verifyTokenMiddleware, createPayPalOrder);

// Capture PayPal order
router.post("/capture-order", verifyTokenMiddleware, capturePayPalOrder);

export default router;
