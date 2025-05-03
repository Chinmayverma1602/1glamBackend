import mongoose from "mongoose";
import Lead from "../models/lead.model.js";
import User from "../models/user.model.js";

export const createLead = async (req, res, next) => {
  try {
    // Handle data wrapper
    const body = req.body.data || req.body;
    const {
      user,
      client_name,
      phone_number,
      lead_status,
      booking_date,
      booking_time,
      service_name,
      price,
      notes,
      owner,
    } = body;

    // Validate required fields and identify missing ones
    const requiredFields = {
      client_name,
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
      throw new Error("Invalid booking date format (e.g., 2025-04-30)");
    }

    // Validate booking_time (format: "HH:mm:ss - HH:mm:ss")
    const timeRangeRegex =
      /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d) - ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRangeRegex.test(booking_time)) {
      res.status(400);
      throw new Error(
        "Invalid booking time format (e.g., 14:30:00 - 15:00:00)"
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

    // Get ownerId (prefer authenticated user, fallback to provided owner as email or ObjectId)
    let ownerId = req.user && req.user.id ? req.user.id : null;
    if (owner) {
      if (mongoose.Types.ObjectId.isValid(owner)) {
        const foundOwner = await User.findById(owner);
        if (!foundOwner) {
          res.status(404);
          throw new Error(`Owner with ID ${owner} not found`);
        }
        ownerId = foundOwner._id;
      } else {
        const foundOwner = await User.findOne({ email: owner });
        if (!foundOwner) {
          res.status(404);
          throw new Error(`Owner with email ${owner} not found`);
        }
        ownerId = foundOwner._id;
      }
    }
    if (!ownerId) {
      res.status(400);
      throw new Error("Owner identifier required");
    }

    // Create lead
    const lead = new Lead({
      userId,
      client_name,
      phone_number,
      lead_status,
      booking_date: bookingDate,
      booking_time,
      service_name,
      price,
      notes: notes || "",
      ownerId,
    });
    await lead.save();

    res.status(201).json({ message: "Lead created successfully", lead });
  } catch (err) {
    next(err);
  }
};

export const getAllLeads = async (req, res, next) => {
  try {
    // No filtering by role or ownership — return all leads
    const leads = await Lead.find().populate(
      "userId ownerId",
      "email first_name last_name"
    );

    res.status(200).json({
      message: "Leads retrieved successfully",
      leads,
      leadIds: leads.map((lead) => lead._id), // Optional: list of just the IDs
    });
  } catch (err) {
    next(err);
  }
};

export const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid lead ID format");
    }
    const lead = await Lead.findById(id).populate(
      "userId ownerId",
      "email first_name last_name"
    );
    if (!lead) {
      res.status(404);
      throw new Error("Lead not found");
    }

    // // Ensure user is associated with the lead (as userId or ownerId) or is Admin
    // // if (
    // //   // !req.user.roles.includes("Admin") &&
    // //   lead.userId.toString() !== req.user.id &&
    // //   lead.ownerId.toString() !== req.user.id
    // // ) {
    //   res.status(403);
    //   throw new Error("Forbidden - You are not associated with this lead");
    // }

    res.json({ message: "Lead retrieved successfully", lead });
  } catch (err) {
    next(err);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    // Handle data wrapper
    const body = req.body.data || req.body;
    const {
      client_name,
      phone_number,
      lead_status,
      booking_date,
      booking_time,
      service_name,
      price,
      notes,
      owner,
    } = body;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid lead ID format");
    }
    const lead = await Lead.findById(id);
    if (!lead) {
      res.status(404);
      throw new Error("Lead not found");
    }

    // Ensure user is associated with the lead (as userId or ownerId) or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      lead.userId.toString() !== req.user.id &&
      lead.ownerId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You are not associated with this lead");
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
        throw new Error("Invalid booking date format (e.g., 2025-04-30)");
      }
      lead.booking_date = bookingDate;
    }

    // Validate booking_time if provided (format: "HH:mm:ss - HH:mm:ss")
    if (booking_time) {
      const timeRangeRegex =
        /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d) - ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      if (!timeRangeRegex.test(booking_time)) {
        res.status(400);
        throw new Error(
          "Invalid booking time format (e.g., 14:30:00 - 15:00:00)"
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
      lead.booking_time = booking_time;
    }

    // Validate price if provided
    if (price !== undefined && (typeof price !== "number" || price < 0)) {
      res.status(400);
      throw new Error("Price must be a non-negative number");
    }

    // Get ownerId if owner is provided
    let ownerId;
    if (owner) {
      if (mongoose.Types.ObjectId.isValid(owner)) {
        const foundOwner = await User.findById(owner);
        if (!foundOwner) {
          res.status(404);
          throw new Error(`Owner with ID ${owner} not found`);
        }
        ownerId = foundOwner._id;
      } else {
        const foundOwner = await User.findOne({ email: owner });
        if (!foundOwner) {
          res.status(404);
          throw new Error(`Owner with email ${owner} not found`);
        }
        ownerId = foundOwner._id;
      }
    }

    // Update fields
    lead.client_name = client_name || lead.client_name;
    lead.phone_number = phone_number || lead.phone_number;
    lead.lead_status = lead_status || lead.lead_status;
    lead.booking_time = booking_time || lead.booking_time;
    lead.service_name = service_name || lead.service_name;
    lead.price = price !== undefined ? price : lead.price;
    lead.notes = notes !== undefined ? notes : lead.notes;
    lead.ownerId = ownerId || lead.ownerId;

    await lead.save();

    res.json({ message: "Lead updated successfully", lead });
  } catch (err) {
    next(err);
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid lead ID format");
    }
    const lead = await Lead.findById(id);
    if (!lead) {
      res.status(404);
      throw new Error("Lead not found");
    }

    // Ensure user is associated with the lead (as userId or ownerId) or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      lead.userId.toString() !== req.user.id &&
      lead.ownerId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You are not associated with this lead");
    }

    await lead.deleteOne();

    res.json({ message: "Lead deleted successfully" });
  } catch (err) {
    next(err);
  }
};