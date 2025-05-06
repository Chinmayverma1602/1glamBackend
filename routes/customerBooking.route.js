import express from "express";
import {
  createCustomerBooking,
  getCustomerBookings,
  getCustomerBookingById,
  updateCustomerBooking,
  deleteCustomerBooking,
} from "../controllers/customerBooking.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create and get all customer bookings (Admins see all, others see own)
router.post("/userBookings", createCustomerBooking);
router.get("/BookingEvents", getCustomerBookings);

// Get, update, delete specific customer booking (Admins or owners only)
router.get("/:id", getCustomerBookingById);
router.put("/:id", updateCustomerBooking);
router.delete("/:id", deleteCustomerBooking);

export default router;
