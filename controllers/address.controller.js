import Address from "../models/address.model.js";
import User from "../models/user.model.js";

export const createAddress = async (req, res, next) => {
  try {
    const {
      user,
      address_line_1,
      address_line_2,
      city,
      zip_code,
      state,
      is_shared_location,
      booth_no,
    } = req.body;

    // Validate required fields
    if (!address_line_1 || !city || !zip_code || !state) {
      res.status(400);
      throw new Error("Address line 1, city, zip code, and state are required");
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

    // Convert is_shared_location to boolean if number
    const normalizedIsShared =
      is_shared_location === 1
        ? true
        : is_shared_location === 0
        ? false
        : is_shared_location ?? false;

    // Create address
    const address = new Address({
      userId,
      address_line_1,
      address_line_2: address_line_2 || "",
      city,
      zip_code,
      state,
      is_shared_location: normalizedIsShared,
      booth_no: booth_no || "",
    });
    await address.save();

    res.status(201).json({ message: "Address created successfully", address });
  } catch (err) {
    next(err);
  }
};

export const getAddresses = async (req, res, next) => {
  try {
    // Admins can see all addresses, others see only their own
    const query = req.user.roles.includes("Admin")
      ? {}
      : { userId: req.user.id };
    const addresses = await Address.find(query).populate(
      "userId",
      "email first_name last_name"
    );

    res.json({ message: "Addresses retrieved successfully", addresses });
  } catch (err) {
    next(err);
  }
};

export const getAddressById = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id).populate(
      "userId",
      "email first_name last_name"
    );
    if (!address) {
      res.status(404);
      throw new Error("Address not found");
    }

    // Ensure user owns the address or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      address.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this address");
    }

    res.json({ message: "Address retrieved successfully", address });
  } catch (err) {
    next(err);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const {
      address_line_1,
      address_line_2,
      city,
      zip_code,
      state,
      is_shared_location,
      booth_no,
    } = req.body;

    const address = await Address.findById(req.params.id);
    if (!address) {
      res.status(404);
      throw new Error("Address not found");
    }

    // Ensure user owns the address or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      address.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this address");
    }

    // Update fields
    address.address_line_1 = address_line_1 || address.address_line_1;
    address.address_line_2 =
      address_line_2 !== undefined ? address_line_2 : address.address_line_2;
    address.city = city || address.city;
    address.zip_code = zip_code || address.zip_code;
    address.state = state || address.state;
    address.is_shared_location =
      is_shared_location === 1
        ? true
        : is_shared_location === 0
        ? false
        : is_shared_location ?? address.is_shared_location;
    address.booth_no = booth_no !== undefined ? booth_no : address.booth_no;

    await address.save();

    res.json({ message: "Address updated successfully", address });
  } catch (err) {
    next(err);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address) {
      res.status(404);
      throw new Error("Address not found");
    }

    // Ensure user owns the address or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      address.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this address");
    }

    await address.deleteOne();

    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    next(err);
  }
};
