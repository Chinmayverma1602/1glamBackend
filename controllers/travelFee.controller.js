import TravelFee from "../models/travelFee.model.js";
import User from "../models/user.model.js";

const validFeeTypes = ["per_km", "flat_rate", "per_hour"];
const validFeeStrings = ["free", "starts_from", "fixed"];

export const createTravelFee = async (req, res, next) => {
  try {
    const { user, fee_type, fee, max_distance } = req.body;

    if (!fee_type || fee === undefined || max_distance === undefined) {
      res.status(400);
      throw new Error("Fee type, fee, and max distance are required");
    }

    if (!validFeeTypes.includes(fee_type)) {
      res.status(400);
      throw new Error(
        "Invalid fee type. Must be one of: per_km, flat_rate, per_hour"
      );
    }

    const isFeeValid =
      (typeof fee === "number" && fee >= 0) ||
      (typeof fee === "string" && validFeeStrings.includes(fee));

    if (!isFeeValid) {
      res.status(400);
      throw new Error(
        "Fee must be a non-negative number or one of: free, starts_from, fixed"
      );
    }

    if (typeof max_distance !== "number" || max_distance < 0) {
      res.status(400);
      throw new Error("Max distance must be a non-negative number");
    }

    let userId;
    if (req.user && req.user.id) {
      userId = req.user.id;
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

    const travelFee = new TravelFee({
      userId,
      fee_type,
      fee,
      max_distance,
    });
    await travelFee.save();

    res
      .status(201)
      .json({ message: "Travel fee created successfully", travelFee });
  } catch (err) {
    next(err);
  }
};

export const getTravelFees = async (req, res, next) => {
  try {
    const query = req.user.roles.includes("Admin")
      ? {}
      : { userId: req.user.id };

    const travelFees = await TravelFee.find(query).populate(
      "userId",
      "email first_name last_name"
    );

    res.json({ message: "Travel fees retrieved successfully", travelFees });
  } catch (err) {
    next(err);
  }
};

export const getTravelFeeById = async (req, res, next) => {
  try {
    const travelFee = await TravelFee.findById(req.params.id).populate(
      "userId",
      "email first_name last_name"
    );
    if (!travelFee) {
      res.status(404);
      throw new Error("Travel fee not found");
    }

    if (
      !req.user.roles.includes("Admin") &&
      travelFee.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this travel fee");
    }

    res.json({ message: "Travel fee retrieved successfully", travelFee });
  } catch (err) {
    next(err);
  }
};

export const updateTravelFee = async (req, res, next) => {
  try {
    const { fee_type, fee, max_distance } = req.body;

    const travelFee = await TravelFee.findById(req.params.id);
    if (!travelFee) {
      res.status(404);
      throw new Error("Travel fee not found");
    }

    if (
      !req.user.roles.includes("Admin") &&
      travelFee.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this travel fee");
    }

    if (fee_type && !validFeeTypes.includes(fee_type)) {
      res.status(400);
      throw new Error(
        "Invalid fee type. Must be one of: per_km, flat_rate, per_hour"
      );
    }

    if (
      fee !== undefined &&
      !(
        (typeof fee === "number" && fee >= 0) ||
        (typeof fee === "string" && validFeeStrings.includes(fee))
      )
    ) {
      res.status(400);
      throw new Error(
        "Fee must be a non-negative number or one of: free, starts_from, fixed"
      );
    }

    if (
      max_distance !== undefined &&
      (typeof max_distance !== "number" || max_distance < 0)
    ) {
      res.status(400);
      throw new Error("Max distance must be a non-negative number");
    }

    travelFee.fee_type = fee_type || travelFee.fee_type;
    travelFee.fee = fee !== undefined ? fee : travelFee.fee;
    travelFee.max_distance =
      max_distance !== undefined ? max_distance : travelFee.max_distance;

    await travelFee.save();

    res.json({ message: "Travel fee updated successfully", travelFee });
  } catch (err) {
    next(err);
  }
};

export const deleteTravelFee = async (req, res, next) => {
  try {
    const travelFee = await TravelFee.findById(req.params.id);
    if (!travelFee) {
      res.status(404);
      throw new Error("Travel fee not found");
    }

    if (
      !req.user.roles.includes("Admin") &&
      travelFee.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this travel fee");
    }

    await travelFee.deleteOne();

    res.json({ message: "Travel fee deleted successfully" });
  } catch (err) {
    next(err);
  }
};
