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
    const validStatuses = ["Inquiry Received", "Follow Up", "Confirmed", "Closed"];
    if (!validStatuses.includes(lead_status)) {
      res.status(400);
      throw new Error("Invalid lead status. Must be one of: Inquiry Received, Follow Up, Confirmed, Closed");
    }

    // Validate booking_date
    const bookingDate = new Date(booking_date);
    if (isNaN(bookingDate.getTime())) {
      res.status(400);
      throw new Error("Invalid booking date format (e.g., 2025-04-30)");
    }

    // Validate booking_time
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(booking_time)) {
      res.status(400);
      throw new Error("Invalid booking time format (e.g., 14:30:00)");
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
      // Check if user is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(user)) {
        const foundUser = await User.findById(user);
        if (!foundUser) {
          res.status(404);
          throw new Error(`User with ID ${user} not found`);
        }
        userId = foundUser._id;
      } else {
        // Treat user as email
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

export const getLeads = async (req, res, next) => {
  try {
    // Admins can see all leads, others see only their own (as userId or ownerId)
    const query = req.user.roles.includes("Admin")
      ? {}
      : { $or: [{ userId: req.user.id }, { ownerId: req.user.id }] };
    const leads = await Lead.find(query).populate("userId ownerId", "email first_name last_name");

    res.json({ message: "Leads retrieved successfully", leads });
  } catch (err) {
    next(err);
  }
};

export const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).populate("userId ownerId", "email first_name last_name");
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

    const lead = await Lead.findById(req.params.id);
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
      const validStatuses = ["Inquiry Received", "Follow Up", "Confirmed", "Closed"];
      if (!validStatuses.includes(lead_status)) {
        res.status(400);
        throw new Error("Invalid lead status. Must be one of: Inquiry Received, Follow Up, Confirmed, Closed");
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

    // Validate booking_time if provided
    if (booking_time) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      if (!timeRegex.test(booking_time)) {
        res.status(400);
        throw new Error("Invalid booking time format (e.g., 14:30:00)");
      }
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
    const lead = await Lead.findById(req.params.id);
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