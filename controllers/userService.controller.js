import UserService from "../models/userService.model.js";
import User from "../models/user.model.js";

export const createUserService = async (req, res, next) => {
  try {
    const { user, service_name, bundle, services_included, duration } =
      req.body;

    // Validate required fields
    if (!service_name || duration === undefined) {
      res.status(400);
      throw new Error("Service name and duration are required");
    }

    // Validate bundle and services_included
    if (bundle === true) {
      if (!Array.isArray(services_included) || services_included.length === 0) {
        res.status(400);
        throw new Error(
          "Bundle services must include at least one sub-service"
        );
      }
      for (const service of services_included) {
        if (
          !service.service_name ||
          service.price === undefined ||
          service.duration === undefined
        ) {
          res.status(400);
          throw new Error(
            "Each sub-service must have service_name, price, and duration"
          );
        }
        if (typeof service.price !== "number" || service.price < 0) {
          res.status(400);
          throw new Error("Sub-service price must be a non-negative number");
        }
        if (typeof service.duration !== "number" || service.duration < 0) {
          res.status(400);
          throw new Error("Sub-service duration must be a non-negative number");
        }
      }
    } else if (services_included && services_included.length > 0) {
      res.status(400);
      throw new Error("Non-bundle services cannot have sub-services");
    }

    // Validate duration
    if (typeof duration !== "number" || duration < 0) {
      res.status(400);
      throw new Error("Duration must be a non-negative number");
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

    // Create user service
    const userService = new UserService({
      userId,
      service_name,
      bundle: bundle || false,
      services_included: services_included || [],
      duration,
    });
    await userService.save();

    res
      .status(201)
      .json({ message: "User service created successfully", userService });
  } catch (err) {
    next(err);
  }
};

export const getUserServices = async (req, res, next) => {
  try {
    // Admins can see all user services, others see only their own
    const query = req.user.roles.includes("Admin")
      ? {}
      : { userId: req.user.id };
    const userServices = await UserService.find(query).populate(
      "userId",
      "email first_name last_name"
    );

    res.json({ message: "User services retrieved successfully", userServices });
  } catch (err) {
    next(err);
  }
};

export const getUserServiceById = async (req, res, next) => {
  try {
    const userService = await UserService.findById(req.params.id).populate(
      "userId",
      "email first_name last_name"
    );
    if (!userService) {
      res.status(404);
      throw new Error("User service not found");
    }

    // Ensure user owns the service or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      userService.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this user service");
    }

    res.json({ message: "User service retrieved successfully", userService });
  } catch (err) {
    next(err);
  }
};

export const updateUserService = async (req, res, next) => {
  try {
    const { service_name, bundle, services_included, duration } = req.body;

    const userService = await UserService.findById(req.params.id);
    if (!userService) {
      res.status(404);
      throw new Error("User service not found");
    }

    // Ensure user owns the service or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      userService.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this user service");
    }

    // Validate bundle and services_included if provided
    if (bundle !== undefined || services_included !== undefined) {
      const newBundle = bundle !== undefined ? bundle : userService.bundle;
      const newServicesIncluded =
        services_included !== undefined
          ? services_included
          : userService.services_included;

      if (newBundle === true) {
        if (
          !Array.isArray(newServicesIncluded) ||
          newServicesIncluded.length === 0
        ) {
          res.status(400);
          throw new Error(
            "Bundle services must include at least one sub-service"
          );
        }
        for (const service of newServicesIncluded) {
          if (
            !service.service_name ||
            service.price === undefined ||
            service.duration === undefined
          ) {
            res.status(400);
            throw new Error(
              "Each sub-service must have service_name, price, and duration"
            );
          }
          if (typeof service.price !== "number" || service.price < 0) {
            res.status(400);
            throw new Error("Sub-service price must be a non-negative number");
          }
          if (typeof service.duration !== "number" || service.duration < 0) {
            res.status(400);
            throw new Error(
              "Sub-service duration must be a non-negative number"
            );
          }
        }
      } else if (newServicesIncluded && newServicesIncluded.length > 0) {
        res.status(400);
        throw new Error("Non-bundle services cannot have sub-services");
      }
    }

    // Validate duration if provided
    if (
      duration !== undefined &&
      (typeof duration !== "number" || duration < 0)
    ) {
      res.status(400);
      throw new Error("Duration must be a non-negative number");
    }

    // Update fields
    userService.service_name = service_name || userService.service_name;
    userService.bundle = bundle !== undefined ? bundle : userService.bundle;
    userService.services_included =
      services_included !== undefined
        ? services_included
        : userService.services_included;
    userService.duration =
      duration !== undefined ? duration : userService.duration;

    await userService.save();

    res.json({ message: "User service updated successfully", userService });
  } catch (err) {
    next(err);
  }
};

export const deleteUserService = async (req, res, next) => {
  try {
    const userService = await UserService.findById(req.params.id);
    if (!userService) {
      res.status(404);
      throw new Error("User service not found");
    }

    // Ensure user owns the service or is Admin
    if (
      !req.user.roles.includes("Admin") &&
      userService.userId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Forbidden - You do not own this user service");
    }

    await userService.deleteOne();

    res.json({ message: "User service deleted successfully" });
  } catch (err) {
    next(err);
  }
};
