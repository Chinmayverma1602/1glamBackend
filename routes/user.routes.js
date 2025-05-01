import express from "express";
import { getAllUsers, createUser } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/getAllUsers", protect, getAllUsers);
router.post("/createUser", createUser);

export default router;
