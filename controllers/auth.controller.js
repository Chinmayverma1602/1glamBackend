import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signup = async (req, res, next) => {
  try {
    // Validate required fields
    const {
      email,
      first_name,
      last_name,
      new_password,
      enabled,
      send_welcome_email,
      roles,
    } = req.body;
    if (!email || !first_name || !last_name || !new_password) {
      res.status(400);
      throw new Error(
        "All fields (email, first_name, last_name, new_password) are required"
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error("Invalid email format");
    }

    // Validate password length
    if (new_password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters long");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error("User with this email already exists");
    }

    // Convert enabled and send_welcome_email to booleans if numbers
    const normalizedEnabled =
      enabled === 1 ? true : enabled === 0 ? false : enabled ?? true;
    const normalizedSendWelcomeEmail =
      send_welcome_email === 1
        ? true
        : send_welcome_email === 0
        ? false
        : send_welcome_email ?? false;

    // Validate roles (optional)
    if (roles && !Array.isArray(roles)) {
      res.status(400);
      throw new Error("Roles must be an array");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Create user
    const user = new User({
      email,
      first_name,
      last_name,
      new_password: hashedPassword,
      enabled: normalizedEnabled,
      send_welcome_email: normalizedSendWelcomeEmail,
      roles: roles || [],
    });
    await user.save();

    // Generate JWT token with roles
    const token = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles.map((r) => r.role) },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    // Validate required fields
    const { usr, pwd } = req.body;
    if (!usr || !pwd) {
      res.status(400);
      throw new Error("Username (usr) and password (pwd) are required");
    }

    // Find user by email (assuming usr maps to email)
    const user = await User.findOne({ email: usr });
    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    // Compare password
    const isMatch = await bcrypt.compare(pwd, user.new_password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    // Generate JWT token with roles
    const token = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles.map((r) => r.role) },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.json({ message: "Login successful", token, user });
  } catch (err) {
    next(err);
  }
};
