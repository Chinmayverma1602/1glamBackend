import express from "express";
import {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
} from "../controllers/lead.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create and get all leads (Admins see all, others see own or owned)
router.post("/Leads", createLead);
router.get("/getAllLeads", getAllLeads);

// Get, update, delete specific lead (Admins or associated users only)
router.get("/getLeads/:id", getLeadById);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);

export default router;