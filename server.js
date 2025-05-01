import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import addressRoutes from "./routes/address.route.js";
import businessRoutes from "./routes/business.route.js";
import travelFeeRoutes from "./routes/travelFee.route.js";
import userServiceRoutes from "./routes/userService.route.js";
import leadRoutes from "./routes/lead.route.js";
dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/resource", authRoutes);
app.use("/api/resource", addressRoutes);
app.use("/api/resource", businessRoutes);
app.use("/api/resource", travelFeeRoutes);
app.use("/api/resource", userServiceRoutes);
app.use("/api/resource", leadRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
