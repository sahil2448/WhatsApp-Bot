import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", (req, res) => {
  console.log("Login attempt:", req.body);

  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ username, role: "admin" }, "secret-key", {
      expiresIn: "24h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("✅ Login successful");
    res.json({
      success: true,
      user: { username, role: "admin" },
    });
  } else {
    console.log("❌ Invalid credentials");
    res.status(401).json({ success: false, error: "Invalid credentials" });
  }
});

router.get("/verify", (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, error: "No token" });
  }

  try {
    const decoded = jwt.verify(token, "secret-key");
    res.json({
      success: true,
      user: { username: decoded.username, role: decoded.role },
    });
  } catch (error) {
    res.status(403).json({ success: false, error: "Invalid token" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

export default router;
