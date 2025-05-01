import express from "express";
import {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create and get all addresses (Admins see all, others see own)
router.post("/userAddress", createAddress);
router.get("/", restrictTo("Admin"), getAddresses);

// Get, update, delete specific address (Admins or owners only)
router.get("/:id", getAddressById);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;
