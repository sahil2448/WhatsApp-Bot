import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ success: false });

  try {
    jwt.verify(token, "secret-key");
    next();
  } catch {
    res.status(403).json({ success: false });
  }
}
