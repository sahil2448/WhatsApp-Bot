// backend/src/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Simple credential check (use environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync("admin123", 10);

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(username, password);

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password required",
      });
    }

    // Check username
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken({ username, role: "admin" });

    // Set secure cookie
    // backend/src/routes/auth.js - Fix cookie settings
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // ✅ MUST be false for localhost
      sameSite: "lax", // ✅ Allow cross-origin navigation
      maxAge: 24 * 60 * 60 * 1000,
      path: "/", // ✅ Available on all paths
    });

    res.json({
      success: true,
      message: "Login successful",
      user: { username, role: "admin" },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
});

router.get("/verify", (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  try {
    const JWT_SECRET =
      process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const decoded = jwt.verify(token, JWT_SECRET); // ✅ Now jwt is imported
    res.json({
      success: true,
      user: {
        username: decoded.username,
        role: decoded.role,
      },
    });
  } catch (error) {
    res.status(403).json({ success: false, error: "Invalid token" });
  }
});

export default router;
