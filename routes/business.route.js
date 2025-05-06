import express from "express";
import {
  createBusiness,
  getBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
} from "../controllers/business.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";

const router = express.Router();

// Middleware: All routes require authentication
router.use(protect);

// Optional: Validate ID format before hitting controllers
router.param("id", (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  next();
}
);

// ✅ Static routes FIRST
router.post("/userBusiness", createBusiness);
router.get("/getBusinesses", getBusinesses);

// ✅ Dynamic routes LAST (to avoid catching static routes)
router.get("/:id", getBusinessById);
router.put("/:id", updateBusiness);
router.delete("/:id", deleteBusiness);

export default router;