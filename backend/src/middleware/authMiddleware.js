// backend/src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "whatsapp-bot-secret-key-2025";

export function authenticateToken(req, res, next) {
  const token =
    req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Error:", error);
    return res
      .status(403)
      .json({ success: false, error: "Invalid or expired token" });
  }
}

export function generateToken(userData) {
  return jwt.sign(
    {
      username: userData.username,
      role: userData.role || "admin",
      loginTime: new Date().toISOString(),
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}
