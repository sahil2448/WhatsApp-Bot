// backend/src/whatsapp.js - Enhanced with better error handling
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode";
import { saveMessage, getMessageHistory } from "./messageStore.js";
import { evaluateRules } from "./rulesEngine.js";

let globalClient = null;

export function initWhatsApp(io) {
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
        "--disable-features=VizDisplayCompositor",
        "--disable-extensions",
        "--no-first-run",
        "--disable-default-apps",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ],
      timeout: 60000, // 1 minute timeout
    },
  });

  globalClient = client;

  // Enhanced error handling
  client.on("qr", async (qr) => {
    try {
      const dataUrl = await qrcode.toDataURL(qr);
      io.emit("qr", { dataUrl });
      io.emit("status", { state: "qr", message: "Scan QR code to connect" });
      console.log("✅ QR Code generated and emitted");
    } catch (error) {
      console.error("❌ QR generation error:", error);
      io.emit("error", { scope: "qr", error: error.message });
    }
  });

  client.on("ready", () => {
    io.emit("status", {
      state: "ready",
      message: "WhatsApp connected successfully",
    });
    console.log("✅ WhatsApp client is ready");
  });

  client.on("authenticated", () => {
    io.emit("status", {
      state: "authenticated",
      message: "Authentication successful",
    });
    console.log("✅ WhatsApp authenticated");
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ Authentication failed:", msg);
    io.emit("status", {
      state: "auth_failure",
      message: "Authentication failed",
    });
  });

  client.on("disconnected", (reason) => {
    console.log("⚠️ WhatsApp disconnected:", reason);
    io.emit("status", {
      state: "disconnected",
      message: `Disconnected: ${reason}`,
    });

    // Don't auto-reconnect immediately to avoid loops
    setTimeout(() => {
      console.log("🔄 Attempting to reconnect...");
      try {
        client.initialize();
      } catch (error) {
        console.error("❌ Reconnection failed:", error);
        io.emit("status", { state: "error", message: "Reconnection failed" });
      }
    }, 10000); // Wait 10 seconds before retry
  });

  // Simple message handler for now (without LLM dependency)
  client.on("message", async (msg) => {
    try {
      if (msg.fromMe) return;

      console.log(`📨 Received message from ${msg.from}: ${msg.body}`);

      // Save incoming message
      const incomingMsg = {
        id: msg.id._serialized,
        from: msg.from,
        body: msg.body,
        timestamp: msg.timestamp * 1000,
        direction: "incoming",
        type: msg.type,
      };

      await saveMessage(incomingMsg);
      io.emit("message_received", incomingMsg);

      // Check rules for auto-reply
      let replyText = await evaluateRules(msg.body, msg.from);

      // If no rule matches, use a simple fallback
      if (!replyText) {
        replyText = "Thank you for your message! We'll get back to you soon.";
      }

      // Send reply
      if (replyText) {
        await msg.reply(replyText);

        const outgoingMsg = {
          id: `out_${Date.now()}`,
          to: msg.from,
          body: replyText,
          timestamp: Date.now(),
          direction: "outgoing",
          type: "chat",
        };

        await saveMessage(outgoingMsg);
        io.emit("message_sent", outgoingMsg);
        console.log(`📤 Sent reply to ${msg.from}: ${replyText}`);
      }
    } catch (error) {
      console.error("❌ Message handling error:", error);
      io.emit("error", { scope: "message_handling", error: error.message });
    }
  });

  // Enhanced initialization with error handling
  try {
    client.initialize();
    console.log("🔄 WhatsApp client initializing...");
  } catch (error) {
    console.error("❌ Failed to initialize WhatsApp client:", error);
    io.emit("status", {
      state: "error",
      message: "Failed to initialize WhatsApp client",
    });
  }

  return client;
}

export function getClient() {
  return globalClient;
}

export async function sendMessage(to, message) {
  if (!globalClient) throw new Error("WhatsApp client not initialized");

  try {
    const chatId = to.includes("@") ? to : `${to}@c.us`;
    const msg = await globalClient.sendMessage(chatId, message);

    const outgoingMsg = {
      id: msg.id._serialized,
      to: chatId,
      body: message,
      timestamp: Date.now(),
      direction: "outgoing",
      type: "chat",
    };

    await saveMessage(outgoingMsg);
    return outgoingMsg;
  } catch (error) {
    console.error("❌ Send message error:", error);
    throw error;
  }
}
