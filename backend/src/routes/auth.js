import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ username }, "secret-key", { expiresIn: "24h" });
    res.cookie("token", token, { httpOnly: true, secure: false });
    res.json({ success: true, user: { username, role: "admin" } });
  } else {
    res.status(401).json({ success: false, error: "Invalid credentials" });
  }
});

router.get("/verify", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, "secret-key");
    res.json({
      success: true,
      user: { username: decoded.username, role: "admin" },
    });
  } catch {
    res.status(403).json({ success: false });
  }
});

export default router;
