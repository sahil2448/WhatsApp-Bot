// backend/src/whatsapp.js - REAL WhatsApp Web.js Implementation
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode";
import OpenAI from "openai";

let globalClient = null;
let globalIO = null;

// Initialize OpenAI (optional - for AI replies)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here"
});

export function initWhatsApp(io) {
  console.log("🔄 Initializing REAL WhatsApp client...");
  globalIO = io;
  
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: "whatsapp-bot",
      dataPath: process.env.SESSION_DIR || "./session",
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
        "--disable-default-apps",
        "--disable-gpu",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      ],
      timeout: 0,
      executablePath: undefined, // Let puppeteer find Chrome
    },
  });

  globalClient = client;

  // REAL QR Code generation from WhatsApp
  client.on("qr", async (qr) => {
    try {
      console.log("📱 REAL WhatsApp QR received! Generating visual QR...");
      
      // Generate real scannable QR code
      const dataUrl = await qrcode.toDataURL(qr, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      io.emit("qr", { dataUrl });
      io.emit("status", { 
        state: "qr", 
        message: "Scan QR code with WhatsApp on your phone" 
      });
      
      console.log("✅ REAL QR Code generated and sent to frontend");
    } catch (error) {
      console.error("❌ QR generation error:", error);
      io.emit("status", { 
        state: "error", 
        message: "Failed to generate QR code" 
      });
    }
  });

  // REAL WhatsApp connection events
  client.on("ready", () => {
    console.log("✅ WhatsApp client is READY! Bot is now active.");
    io.emit("status", { 
      state: "ready", 
      message: "WhatsApp connected successfully! Bot is active." 
    });
  });

  client.on("authenticated", () => {
    console.log("✅ WhatsApp authenticated successfully");
    io.emit("status", { 
      state: "authenticated", 
      message: "Authentication successful" 
    });
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ WhatsApp authentication failed:", msg);
    io.emit("status", { 
      state: "auth_failure", 
      message: "Authentication failed - please scan QR again" 
    });
  });

  client.on("disconnected", (reason) => {
    console.log("⚠️ WhatsApp disconnected:", reason);
    io.emit("status", { 
      state: "disconnected", 
      message: `Disconnected: ${reason}` 
    });
    
    // Try to reconnect after 5 seconds
    setTimeout(() => {
      console.log("🔄 Attempting to reconnect...");
      client.initialize();
    }, 5000);
  });

  // REAL message handling from WhatsApp
  client.on("message", async (msg) => {
    try {
      // Skip messages from bot itself
      if (msg.fromMe) return;
      
      console.log(`📨 REAL message received from ${msg.from}: ${msg.body}`);
      
      // Emit incoming message to frontend
      io.emit("message_received", {
        id: msg.id._serialized,
        from: msg.from,
        body: msg.body,
        timestamp: msg.timestamp * 1000,
        direction: "incoming",
        type: msg.type
      });

      // Generate AI response
      let reply = await generateAIReply(msg.body);
      
      // Send reply back to WhatsApp
      await msg.reply(reply);
      console.log(`🤖 AI reply sent: ${reply}`);
      
      // Emit outgoing message to frontend
      io.emit("message_sent", {
        id: `reply_${Date.now()}`,
        to: msg.from,
        body: reply,
        timestamp: Date.now(),
        direction: "outgoing",
        type: "chat"
      });

    } catch (error) {
      console.error("❌ Message handling error:", error);
    }
  });

  // Handle loading screen
  client.on("loading_screen", (percent, message) => {
    console.log(`Loading: ${percent}% - ${message}`);
    io.emit("status", { 
      state: "loading", 
      message: `Loading WhatsApp: ${percent}%` 
    });
  });

  // Initialize the client
  console.log("🚀 Starting WhatsApp client initialization...");
  client.initialize().catch(error => {
    console.error("❌ Failed to initialize WhatsApp client:", error);
    io.emit("status", { 
      state: "error", 
      message: `Initialization failed: ${error.message}` 
    });
  });

  return client;
}

// AI Reply Generation
async function generateAIReply(message) {
  try {
    // Simple rule-based replies (fallback if OpenAI not available)
    const text = message.toLowerCase();
    
    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
      return "Hello! 👋 How can I help you today?";
    }
    
    if (text.includes('help') || text.includes('support')) {
      return "I'm here to help! Please tell me what you need assistance with.";
    }
    
    if (text.includes('bye') || text.includes('goodbye')) {
      return "Goodbye! Have a great day! 👋";
    }
    
    if (text.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    }

    // Try OpenAI if available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your-api-key-here") {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful WhatsApp bot assistant. Keep responses short and friendly."
          },
          {
            role: "user", 
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });
      
      return completion.choices[0].message.content;
    }
    
    // Default response
    return "Thanks for your message! I'm a WhatsApp bot here to help. How can I assist you today?";
    
  } catch (error) {
    console.error("AI reply error:", error);
    return "Thank you for your message! I'm here to help.";
  }
}

// Send message programmatically 
export async function sendWhatsAppMessage(to, message) {
  if (!globalClient) {
    throw new Error("WhatsApp client not initialized");
  }
  
  try {
    const chatId = to.includes('@') ? to : `${to}@c.us`;
    await globalClient.sendMessage(chatId, message);
    console.log(`✅ Message sent to ${chatId}: ${message}`);
    
    return {
      success: true,
      id: `sent_${Date.now()}`,
      to: chatId,
      body: message,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("❌ Send message error:", error);
    throw error;
  }
}

export function getClient() {
  return globalClient;
}
