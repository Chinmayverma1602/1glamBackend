import express from "express";
import {
  createUserService,
  getUserServices,
  getUserServiceById,
  updateUserService,
  deleteUserService,
} from "../controllers/userService.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create and get all user services (Admins see all, others see own)
router.post("/userServices", createUserService);
router.get("/", getUserServices);

// Get, update, delete specific user service (Admins or owners only)
router.get("/:id", getUserServiceById);
router.put("/:id", updateUserService);
router.delete("/:id", deleteUserService);

export default router;
