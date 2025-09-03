// backend/src/index.js - REAL WhatsApp Web.js Implementation
import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import pkg from "whatsapp-web.js";
import qrcode from "qrcode";

// Import routes
import authRoutes from "./routes/auth.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

const { Client, LocalAuth } = pkg;

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
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ status: "WhatsApp Bot API is running" });
});

// REAL WhatsApp Client - Following Official Documentation
let whatsappClient = null;
let isWhatsAppReady = false;

console.log("🚀 Initializing REAL WhatsApp Web.js client...");

// Create client with REAL configuration
whatsappClient = new Client({
  authStrategy: new LocalAuth({
    clientId: "whatsapp-bot",
    dataPath: "./session",
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--no-first-run",
      "--disable-extensions",
      "--disable-background-networking",
    ],
  },
});

// REAL QR Event - From WhatsApp Web.js
whatsappClient.on("qr", async (qr) => {
  console.log(
    "📱 REAL QR RECEIVED from WhatsApp!",
    qr.substring(0, 50) + "..."
  );

  try {
    // Convert REAL QR string to visual QR code
    const qrDataUrl = await qrcode.toDataURL(qr, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Send REAL QR to frontend
    io.emit("qr", { dataUrl: qrDataUrl });
    io.emit("status", {
      state: "qr",
      message: "Scan this REAL QR code with your phone",
    });

    console.log("✅ REAL QR code sent to frontend");
  } catch (error) {
    console.error("❌ QR generation error:", error);
  }
});

// REAL Ready Event - When WhatsApp is actually connected
whatsappClient.on("ready", () => {
  console.log("✅ WhatsApp Client is REALLY READY!");
  isWhatsAppReady = true;

  io.emit("status", {
    state: "ready",
    message: "WhatsApp connected successfully!",
  });
});

// REAL Authentication Events
whatsappClient.on("authenticated", () => {
  console.log("✅ WhatsApp AUTHENTICATED successfully");
  io.emit("status", {
    state: "authenticated",
    message: "Authentication successful",
  });
});

whatsappClient.on("auth_failure", (msg) => {
  console.error("❌ WhatsApp authentication failed:", msg);
  io.emit("status", {
    state: "auth_failure",
    message: "Authentication failed - scan QR again",
  });
});

whatsappClient.on("disconnected", (reason) => {
  console.log("⚠️ WhatsApp disconnected:", reason);
  isWhatsAppReady = false;
  io.emit("status", {
    state: "disconnected",
    message: `Disconnected: ${reason}`,
  });
});

// REAL Message Handling - From actual WhatsApp messages
whatsappClient.on("message", async (message) => {
  // Skip messages from bot itself
  if (message.fromMe) return;

  console.log(`📨 REAL message received from ${message.from}: ${message.body}`);

  // Send to frontend in real-time
  io.emit("message_received", {
    id: message.id._serialized,
    from: message.from,
    body: message.body,
    timestamp: message.timestamp * 1000,
    direction: "incoming",
    type: message.type,
  });

  // Generate auto-reply
  let reply = generateAutoReply(message.body);

  try {
    // Send REAL reply back to WhatsApp
    await message.reply(reply);
    console.log(`🤖 REAL reply sent: ${reply}`);

    // Send to frontend
    io.emit("message_sent", {
      id: `reply_${Date.now()}`,
      to: message.from,
      body: reply,
      timestamp: Date.now(),
      direction: "outgoing",
      type: "chat",
    });
  } catch (error) {
    console.error("❌ Reply error:", error);
  }
});

// Simple auto-reply logic
function generateAutoReply(messageBody) {
  const text = messageBody.toLowerCase();

  if (text.includes("hello") || text.includes("hi")) {
    return "Hello! 👋 How can I help you today?";
  }
  if (text.includes("help")) {
    return "I'm here to help! What do you need assistance with?";
  }
  if (text.includes("bye")) {
    return "Goodbye! Have a great day! 👋";
  }

  return "Thanks for your message! How can I assist you?";
}

// Mock data for API endpoints
let mockMessages = [];
let mockRules = [
  {
    id: "1",
    name: "Greeting",
    keywords: ["hello", "hi", "hey"],
    response: "Hello! How can I help you today?",
    enabled: true,
    priority: 1,
  },
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
      incomingCount: mockMessages.filter((m) => m.direction === "incoming")
        .length,
      outgoingCount: mockMessages.filter((m) => m.direction === "outgoing")
        .length,
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
  mockRules = mockRules.filter((rule) => rule.id !== req.params.id);
  res.json({ success: true });
});

// Socket.IO for real-time frontend communication
io.on("connection", (socket) => {
  console.log("🔌 Frontend connected:", socket.id);

  // Send manual messages through WhatsApp
  socket.on("send_message", async (data) => {
    if (!isWhatsAppReady) {
      socket.emit("send_error", { error: "WhatsApp not connected" });
      return;
    }

    try {
      const { to, message } = data;
      const chatId = to.includes("@") ? to : `${to}@c.us`;

      // Send through REAL WhatsApp
      await whatsappClient.sendMessage(chatId, message);

      const newMessage = {
        id: `sent_${Date.now()}`,
        to: chatId,
        body: message,
        timestamp: Date.now(),
        direction: "outgoing",
        type: "chat",
      };

      mockMessages.unshift(newMessage);
      socket.emit("message_sent", newMessage);

      console.log(
        `✅ Message sent through REAL WhatsApp to ${chatId}: ${message}`
      );
    } catch (error) {
      console.error("❌ Send message error:", error);
      socket.emit("send_error", { error: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Frontend disconnected:", socket.id);
  });
});

// Initialize REAL WhatsApp client
console.log("🔥 Starting REAL WhatsApp Web.js initialization...");
whatsappClient.initialize().catch((error) => {
  console.error("❌ WhatsApp initialization failed:", error);
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("📱 Waiting for REAL WhatsApp connection...");
});
