import express from "express";
import {
  createCustomerBooking,
  getCustomerBookings,
  getCustomerBookingById,
  updateCustomerBooking,
  deleteCustomerBooking,
} from "../controllers/customerBooking.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Optional: Validate ID format before hitting controllers
router.param("id", (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  next();
});

// Create and get all customer bookings (Admins see all, others see own)
router.post("/userBookings", createCustomerBooking);
router.get("/BookingEvents", getCustomerBookings);

// Get, update, delete specific customer booking (Admins or owners only)
router.get("/:id", getCustomerBookingById);
router.put("/:id", updateCustomerBooking);
router.delete("/:id", deleteCustomerBooking);

export default router;
