import mongoose from "mongoose";
import CustomerBooking from "../models/customerBooking.model.js";
import User from "../models/user.model.js";

export const createCustomerBooking = async (req, res, next) => {
  try {
    // Handle data wrapper
    const body = req.body.data || req.body;
    const {
      user,
      customer_name,
      phone_number,
      lead_status,
      booking_date,
      booking_time,
      service_name,
      price,
      notes,
    } = body;

    // Validate required fields and identify missing ones
    const requiredFields = {
      customer_name,
      phone_number,
      lead_status,
      booking_date,
      booking_time,
      service_name,
      price,
    };
    const missingFields = Object.keys(requiredFields).filter(
      (key) => requiredFields[key] === undefined || requiredFields[key] === null
    );
    if (missingFields.length > 0) {
      res.status(400);
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Validate phone_number
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(phone_number)) {
      res.status(400);
      throw new Error("Invalid phone number format (e.g., +1234567890)");
    }

    // Validate lead_status
    const validStatuses = [
      "Inbound",
      "Qualifying",
      "Proposal Sent",
      "Proposal Reminder",
      "Proposal Accepted",
      "Deposit Requested",
      "Deposit Reminder",
      "Deposit Received",
      "Confirmed",
      "Completed",
      "Closed",
      "Lost",
      "Waitlisted",
    ];
    if (!validStatuses.includes(lead_status)) {
      res.status(400);
      throw new Error(
        `Invalid lead status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    // Validate booking_date
    const bookingDate = new Date(booking_date);
    if (isNaN(bookingDate.getTime())) {
      res.status(400);
      throw new Error("Invalid booking date format (e.g., 2025-05-01)");
    }

    // Validate booking_time (format: "HH:mm:ss - HH:mm:ss")
    const timeRangeRegex =
      /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d) - ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRangeRegex.test(booking_time)) {
      res.status(400);
      throw new Error(
        "Invalid booking time format (e.g., 16:30:00 - 17:00:00)"
      );
    }

    // Validate start time is before end time
    const [startTime, endTime] = booking_time.split(" - ").map((time) => {
      const [hours, minutes, seconds] = time.split(":").map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    });
    if (startTime >= endTime) {
      res.status(400);
      throw new Error("Start time must be before end time");
    }

    // Validate price
    if (typeof price !== "number" || price < 0) {
      res.status(400);
      throw new Error("Price must be a non-negative number");
    }

    // Get userId (prefer authenticated user, fallback to provided user as ObjectId or email)
    let userId;
    if (req.user && req.user.id) {
      userId = req.user.id; // From JWT
    } else if (user) {
      if (mongoose.Types.ObjectId.isValid(user)) {
        const foundUser = await User.findById(user);
        if (!foundUser) {
          res.status(404);
          throw new Error(`User with ID ${user} not found`);
        }
        userId = foundUser._id;
      } else {
        const foundUser = await User.findOne({ email: user });
        if (!foundUser) {
          res.status(404);
          throw new Error(`User with email ${user} not found`);
        }
        userId = foundUser._id;
      }
    } else {
      res.status(400);
      throw new Error("User identifier required");
    }

    // Create customer booking
    const customerBooking = new CustomerBooking({
      userId,
      customer_name,
      phone_number,
      lead_status,
      booking_date: bookingDate,
      booking_time,
      service_name,
      price,
      notes: notes || "",
    });
    await customerBooking.save();

    res
      .status(201)
      .json({
        message: "Customer booking created successfully",
        customerBooking,
      });
  } catch (err) {
    next(err);
  }
};

export const getCustomerBookings = async (req, res, next) => {
  try {
    // Admins can see all bookings, others see only their own (as userId)
    const query = req.user.roles.includes("Admin")
      ? {}
      : { userId: req.user.id };
    const customerBookings = await CustomerBooking.find(query).populate(
      "userId",
      "email first_name last_name"
    );

    res.json({
      message: "Customer bookings retrieved successfully",
      customerBookings,
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid customer booking ID format");
    }
    const customerBooking = await CustomerBooking.findById(id).populate(
      "userId",
      "email first_name last_name"
    );
    if (!customerBooking) {
      res.status(404);
      throw new Error("Customer booking not found");
    }

    // Ensure user owns the booking or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      customerBooking.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this customer booking");
    }

    res.json({
      message: "Customer booking retrieved successfully",
      customerBooking,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCustomerBooking = async (req, res, next) => {
  try {
    // Handle data wrapper
    const body = req.body.data || req.body;
    const {
      customer_name,
      phone_number,
      lead_status,
      booking_date,
      booking_time,
      service_name,
      price,
      notes,
    } = body;

    const customerBooking = await CustomerBooking.findById(req.params.id);
    if (!customerBooking) {
      res.status(404);
      throw new Error("Customer booking not found");
    }

    // Ensure user owns the booking or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      customerBooking.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this customer booking");
    }

    // Validate phone_number if provided
    if (phone_number && !/^\+\d{10,15}$/.test(phone_number)) {
      res.status(400);
      throw new Error("Invalid phone number format (e.g., +1234567890)");
    }

    // Validate lead_status if provided
    if (lead_status) {
      const validStatuses = [
        "Inbound",
        "Qualifying",
        "Proposal Sent",
        "Proposal Reminder",
        "Proposal Accepted",
        "Deposit Requested",
        "Deposit Reminder",
        "Deposit Received",
        "Confirmed",
        "Completed",
        "Closed",
        "Lost",
        "Waitlisted",
      ];
      if (!validStatuses.includes(lead_status)) {
        res.status(400);
        throw new Error(
          `Invalid lead status. Must be one of: ${validStatuses.join(", ")}`
        );
      }
    }

    // Validate booking_date if provided
    if (booking_date) {
      const bookingDate = new Date(booking_date);
      if (isNaN(bookingDate.getTime())) {
        res.status(400);
        throw new Error("Invalid booking date format (e.g., 2025-05-01)");
      }
      customerBooking.booking_date = bookingDate;
    }

    // Validate booking_time if provided (format: "HH:mm:ss - HH:mm:ss")
    if (booking_time) {
      const timeRangeRegex =
        /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d) - ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      if (!timeRangeRegex.test(booking_time)) {
        res.status(400);
        throw new Error(
          "Invalid booking time format (e.g., 16:30:00 - 17:00:00)"
        );
      }
      const [startTime, endTime] = booking_time.split(" - ").map((time) => {
        const [hours, minutes, seconds] = time.split(":").map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      });
      if (startTime >= endTime) {
        res.status(400);
        throw new Error("Start time must be before end time");
      }
      customerBooking.booking_time = booking_time;
    }

    // Validate price if provided
    if (price !== undefined && (typeof price !== "number" || price < 0)) {
      res.status(400);
      throw new Error("Price must be a non-negative number");
    }

    // Update fields
    customerBooking.customer_name =
      customer_name || customerBooking.customer_name;
    customerBooking.phone_number = phone_number || customerBooking.phone_number;
    customerBooking.lead_status = lead_status || customerBooking.lead_status;
    customerBooking.service_name = service_name || customerBooking.service_name;
    customerBooking.price = price !== undefined ? price : customerBooking.price;
    customerBooking.notes = notes !== undefined ? notes : customerBooking.notes;

    await customerBooking.save();

    res.json({
      message: "Customer booking updated successfully",
      customerBooking,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomerBooking = async (req, res, next) => {
  try {
    const customerBooking = await CustomerBooking.findById(req.params.id);
    if (!customerBooking) {
      res.status(404);
      throw new Error("Customer booking not found");
    }

    // Ensure user owns the booking or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      customerBooking.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this customer booking");
    }

    await customerBooking.deleteOne();

    res.json({ message: "Customer booking deleted successfully" });
  } catch (err) {
    next(err);
  }
};
