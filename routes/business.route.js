import express from "express";
import {
  createBusiness,
  getBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
} from "../controllers/business.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create and get all businesses (Admins see all, others see own)
router.post("/userBussiness", createBusiness);
router.get("/", getBusinesses);

// Get, update, delete specific business (Admins or owners only)
router.get("/:id", getBusinessById);
router.put("/:id", updateBusiness);
router.delete("/:id", deleteBusiness);

export default router;
