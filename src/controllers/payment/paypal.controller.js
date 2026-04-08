import { OrdersController } from "@paypal/paypal-server-sdk";
import client from "../../config/paypal.js";
import Register from "../../models/register/register.model.js";
import { sendRegistrationConfirmedEmail } from "../../mailtrap/emails.js";

const ordersController = new OrdersController(client);

// Create a PayPal order for a registration
export const createPayPalOrder = async (req, res) => {
  try {
    const { registrationId } = req.body;

    const registration = await Register.findById(registrationId).populate("event");
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    if (!registration || !registration.event) {
      return res.status(404).json({ success: false, message: "Registration or Event not found" });
    }

    if (registration.paymentStatus === "PAID") {
      return res.status(400).json({ success: false, message: "Registration already paid" });
    }

    if (registration.event.isFree) {
      return res.status(400).json({ success: false, message: "Event is free, no payment required" });
    }

    const price = Number(registration.event.price);
    if (isNaN(price) || price <= 0) {
        return res.status(400).json({ success: false, message: "Event price is invalid for payment" });
    }

    const collect = {
      body: {
        intent: "CAPTURE",
        purchaseUnits: [
          {
            amount: {
              currencyCode: "USD",
              value: price.toFixed(2),
            },
            description: `Registration for ${registration.event.title.substring(0, 50)}`,
          },
        ],
      },
      prefer: "return=representation",
    };

    const response = await ordersController.createOrder(collect);
    const { result, ...httpResponse } = response;
    
    // Save the order ID to the registration
    registration.paypalOrderId = result.id;
    await registration.save();

    return res.status(httpResponse.statusCode || 201).json({
      success: true,
      order: result,
    });
  } catch (error) {
    console.error("createPayPalOrder error detail:", error);
    if (error.result) {
        console.error("PayPal error result:", JSON.stringify(error.result, null, 2));
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong while creating PayPal order",
    });
  }
};

// Capture a PayPal order and update registration status
export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const collect = {
      id: orderId,
      prefer: "return=representation",
    };

    const response = await ordersController.captureOrder(collect);
    const { result, ...httpResponse } = response;

    // Find the registration with this order ID
    const registration = await Register.findOne({ paypalOrderId: orderId }).populate("user");
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found for this PayPal order" });
    }

    // Check if capture was successful
    const capture = result.purchaseUnits[0].payments.captures[0];
    if (capture.status === "COMPLETED") {
      registration.paymentStatus = "PAID";
      registration.status = "REGISTERED";
      registration.paypalCaptureId = capture.id;
      await registration.save();

      // Update availableSeats now that payment is successful
      const event = await import("../../models/event/event.model.js").then(m => m.default.findById(registration.event));
      if (event && typeof event.totalSeats === "number") {
        const currentAvailable = event.availableSeats ?? event.totalSeats;
        event.availableSeats = Math.max(0, currentAvailable - 1);
        await event.save();
      }

      // Send confirmation email with QR code
      if (event && registration.user) {
        await sendRegistrationConfirmedEmail(
          registration.user.email,
          registration.user.name,
          event.title,
          event.startDate ? event.startDate.toLocaleString() : "N/A",
          event.location?.venue || "TBD",
          registration._id
        );
      }

      return res.status(httpResponse.statusCode || 200).json({
        success: true,
        message: "Payment captured and registration confirmed successfully",
        registration,
      });
    } else {
      registration.status = "FAILED";
      await registration.save();
      return res.status(400).json({
        success: false,
        message: `Payment status: ${capture.status}`,
      });
    }
  } catch (error) {
    console.error("capturePayPalOrder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong while capturing PayPal order",
    });
  }
};
