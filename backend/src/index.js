// backend/src/index.js - Complete backend with REAL WhatsApp
import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Import routes and WhatsApp
import authRoutes from "./routes/auth.js";
import { authenticateToken } from "./middleware/authMiddleware.js";
import { initWhatsApp, sendWhatsAppMessage } from "./whatsapp.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new IOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ status: "WhatsApp Bot API is running" });
});

// Mock data for storing messages and rules
let mockMessages = [
  {
    id: "1",
    from: "1234567890@c.us",
    body: "Hello!",
    timestamp: Date.now() - 3600000,
    direction: "incoming",
    type: "chat",
  },
  {
    id: "2",
    to: "1234567890@c.us",
    body: "Hello! How can I help you today?",
    timestamp: Date.now() - 3590000,
    direction: "outgoing",
    type: "chat",
  },
];

let mockRules = [
  {
    id: "1",
    name: "Greeting",
    keywords: ["hello", "hi", "hey"],
    response: "Hello! How can I help you today?",
    enabled: true,
    priority: 1,
  },
  {
    id: "2",
    name: "Help Request", 
    keywords: ["help", "support"],
    response: "I'm here to help! Please describe what you need.",
    enabled: true,
    priority: 2,
  }
];

// Protected API routes
app.get("/api/messages", authenticateToken, (req, res) => {
  res.json({ success: true, data: mockMessages });
});

app.get("/api/stats", authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalMessages: mockMessages.length,
      incomingCount: mockMessages.filter(m => m.direction === "incoming").length,
      outgoingCount: mockMessages.filter(m => m.direction === "outgoing").length,
      uniqueContacts: 2,
      todayMessages: mockMessages.length,
    },
  });
});

app.get("/api/rules", authenticateToken, (req, res) => {
  res.json({ success: true, data: mockRules });
});

app.post("/api/rules", authenticateToken, (req, res) => {
  const newRule = {
    id: `rule_${Date.now()}`,
    ...req.body,
    enabled: true,
  };
  mockRules.push(newRule);
  res.json({ success: true, data: newRule });
});

app.delete("/api/rules/:id", authenticateToken, (req, res) => {
  mockRules = mockRules.filter(rule => rule.id !== req.params.id);
  res.json({ success: true });
});

// Socket.IO for real-time communication
io.on("connection", (socket) => {
  console.log("🔌 Frontend connected:", socket.id);

  // Handle manual message sending through dashboard
  socket.on("send_message", async (data) => {
    try {
      const { to, message } = data;
      
      // Send through real WhatsApp
      const result = await sendWhatsAppMessage(to, message);
      
      // Store in mock data
      const newMessage = {
        id: result.id,
        to: result.to,
        body: result.body,
        timestamp: result.timestamp,
        direction: "outgoing",
        type: "chat",
      };
      
      mockMessages.unshift(newMessage);
      socket.emit("message_sent", newMessage);
      
    } catch (error) {
      console.error("Send message error:", error);
      socket.emit("send_error", { error: error.message });
    }
  });

  // Store incoming messages from WhatsApp
  socket.on("store_message", (message) => {
    mockMessages.unshift(message);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Frontend disconnected:", socket.id);
  });
});

// Initialize REAL WhatsApp client
console.log("🚀 Initializing WhatsApp Web.js client...");
initWhatsApp(io);

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("📱 WhatsApp Bot starting - QR code will appear when ready");
});
