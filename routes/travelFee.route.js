import express from "express";
import {
  createTravelFee,
  getTravelFees,
  getTravelFeeById,
  updateTravelFee,
  deleteTravelFee,
} from "../controllers/travelFee.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create and get all travel fees (Admins see all, others see own)
router.post("/TravelFees", createTravelFee);
router.get("/", getTravelFees);

// Get, update, delete specific travel fee (Admins or owners only)
router.get("/:id", getTravelFeeById);
router.put("/:id", updateTravelFee);
router.delete("/:id", deleteTravelFee);

export default router;
