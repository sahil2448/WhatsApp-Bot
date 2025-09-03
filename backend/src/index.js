// backend/src/index.js - CORRECT middleware order
import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Your imports
import { initWhatsApp, sendMessage } from "./whatsapp.js";
import { getMessages, getMessageStats } from "./messageStore.js";
import { getRules, addRule, updateRule, deleteRule } from "./rulesEngine.js";
import authRoutes from "./routes/auth.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ CRITICAL: Middleware in correct order
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// ✅ MUST come before routes that need JSON parsing
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(cookieParser()); // Parse cookies

// ✅ Routes after middleware
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "WhatsApp Bot API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Protected routes
app.get("/api/messages", authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const messages = await getMessages(limit);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await getMessageStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rules API
app.get("/api/rules", authenticateToken, async (req, res) => {
  try {
    const rules = await getRules();
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/rules", authenticateToken, async (req, res) => {
  try {
    const rule = await addRule(req.body);
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put("/api/rules/:id", authenticateToken, async (req, res) => {
  try {
    const rule = await updateRule(req.params.id, req.body);
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete("/api/rules/:id", authenticateToken, async (req, res) => {
  try {
    await deleteRule(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("🔌 Frontend connected:", socket.id);

  socket.on("send_message", async (data) => {
    try {
      const { to, message } = data;
      const sentMessage = await sendMessage(to, message);
      socket.emit("message_sent", sentMessage);
      io.emit("message_sent", sentMessage);
    } catch (error) {
      socket.emit("send_error", { error: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Frontend disconnected:", socket.id);
  });
});

// Initialize WhatsApp
initWhatsApp(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 WhatsApp Bot initializing...`);
});
