import Business from "../models/business.model.js";
import User from "../models/user.model.js";

export const createBusiness = async (req, res, next) => {
  try {
    const { user, business_name, business_type, owner_name, phone, address } =
      req.body;

    // Validate required fields
    if (!business_name || !business_type || !owner_name || !phone || !address) {
      res.status(400);
      throw new Error(
        "All fields (business_name, business_type, owner_name, phone, address) are required"
      );
    }

    // Basic phone validation (e.g., starts with + and has digits)
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400);
      throw new Error("Invalid phone number format (e.g., +1234567890)");
    }

    // Get userId (prefer authenticated user, fallback to provided user email)
    let userId;
    if (req.user && req.user.id) {
      userId = req.user.id; // From JWT
    } else if (user) {
      const foundUser = await User.findOne({ email: user });
      if (!foundUser) {
        res.status(404);
        throw new Error("User not found");
      }
      userId = foundUser._id;
    } else {
      res.status(400);
      throw new Error("User identifier required");
    }

    // Create business
    const business = new Business({
      userId,
      business_name,
      business_type,
      owner_name,
      phone,
      address,
    });
    await business.save();

    res
      .status(201)
      .json({ message: "Business created successfully", business });
  } catch (err) {
    next(err);
  }
};

export const getBusinesses = async (req, res, next) => {
  try {
    // Admins can see all businesses, others see only their own
    const query = req.user.roles.includes("Admin")
      ? {}
      : { userId: req.user.id };
    const businesses = await Business.find(query).populate(
      "userId",
      "email first_name last_name"
    );

    res.json({ message: "Businesses retrieved successfully", businesses });
  } catch (err) {
    next(err);
  }
};

export const getBusinessById = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id).populate(
      "userId",
      "email first_name last_name"
    );
    if (!business) {
      res.status(404);
      throw new Error("Business not found");
    }

    // Ensure user owns the business or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      business.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this business");
    }

    res.json({ message: "Business retrieved successfully", business });
  } catch (err) {
    next(err);
  }
};

export const updateBusiness = async (req, res, next) => {
  try {
    const { business_name, business_type, owner_name, phone, address } =
      req.body;

    const business = await Business.findById(req.params.id);
    if (!business) {
      res.status(404);
      throw new Error("Business not found");
    }

    // Ensure user owns the business or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      business.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this business");
    }

    // Validate phone if provided
    if (phone && !/^\+\d{10,15}$/.test(phone)) {
      res.status(400);
      throw new Error("Invalid phone number format (e.g., +1234567890)");
    }

    // Update fields
    business.business_name = business_name || business.business_name;
    business.business_type = business_type || business.business_type;
    business.owner_name = owner_name || business.owner_name;
    business.phone = phone || business.phone;
    business.address = address || business.address;

    await business.save();

    res.json({ message: "Business updated successfully", business });
  } catch (err) {
    next(err);
  }
};

export const deleteBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      res.status(404);
      throw new Error("Business not found");
    }

    // Ensure user owns the business or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      business.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this business");
    }

    await business.deleteOne();

    res.json({ message: "Business deleted successfully" });
  } catch (err) {
    next(err);
  }
};
    