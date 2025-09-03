// // backend/src/whatsapp.js - WORKING WhatsApp integration
// import pkg from "whatsapp-web.js";
// const { Client, LocalAuth } = pkg;
// import qrcode from "qrcode";

// let globalClient = null;

// export function initWhatsApp(io) {
//   // Clear any existing session first
//   console.log("🔄 Initializing WhatsApp client...");

//   const client = new Client({
//     authStrategy: new LocalAuth({
//       clientId: "whatsapp-bot",
//       dataPath: process.env.SESSION_DIR || "./session",
//     }),
//     puppeteer: {
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-web-security",
//         "--no-first-run",
//         "--disable-extensions",
//         "--disable-default-apps",
//         "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
//       ],
//       timeout: 60000,
//     },
//   });

//   globalClient = client;

//   // QR Code generation
//   client.on("qr", async (qr) => {
//     try {
//       console.log("📱 Generating QR code...");
//       const dataUrl = await qrcode.toDataURL(qr, {
//         width: 300,
//         margin: 2,
//       });
//       io.emit("qr", { dataUrl });
//       io.emit("status", { state: "qr", message: "Scan QR code to connect" });
//       console.log("✅ QR Code generated and emitted");
//     } catch (error) {
//       console.error("❌ QR generation error:", error);
//       io.emit("error", { scope: "qr", error: error.message });
//     }
//   });

//   // Connection events
//   client.on("ready", () => {
//     io.emit("status", {
//       state: "ready",
//       message: "WhatsApp connected successfully",
//     });
//     console.log("✅ WhatsApp client is ready");
//   });

//   client.on("authenticated", () => {
//     io.emit("status", {
//       state: "authenticated",
//       message: "Authentication successful",
//     });
//     console.log("✅ WhatsApp authenticated");
//   });

//   client.on("auth_failure", (msg) => {
//     console.error("❌ Authentication failed:", msg);
//     io.emit("status", {
//       state: "auth_failure",
//       message: "Authentication failed",
//     });
//   });

//   client.on("disconnected", (reason) => {
//     console.log("⚠️ WhatsApp disconnected:", reason);
//     io.emit("status", {
//       state: "disconnected",
//       message: `Disconnected: ${reason}`,
//     });
//   });

//   // Message handling
//   client.on("message", async (msg) => {
//     try {
//       if (msg.fromMe) return;
//       console.log(`📨 Message from ${msg.from}: ${msg.body}`);

//       // Simple auto-reply logic
//       let reply = "Thank you for your message! We'll get back to you soon.";

//       const text = msg.body.toLowerCase();
//       if (text.includes("hello") || text.includes("hi")) {
//         reply = "Hello! How can I help you today?";
//       } else if (text.includes("help")) {
//         reply = "I'm here to help! Please describe what you need.";
//       }

//       await msg.reply(reply);
//       console.log(`📤 Sent reply: ${reply}`);

//       // Emit to frontend
//       io.emit("message_received", {
//         id: msg.id._serialized,
//         from: msg.from,
//         body: msg.body,
//         timestamp: msg.timestamp * 1000,
//         direction: "incoming",
//       });

//       io.emit("message_sent", {
//         id: `reply_${Date.now()}`,
//         to: msg.from,
//         body: reply,
//         timestamp: Date.now(),
//         direction: "outgoing",
//       });
//     } catch (error) {
//       console.error("❌ Message handling error:", error);
//     }
//   });

//   // Initialize with error handling
//   client.initialize().catch((error) => {
//     console.error("❌ Failed to initialize WhatsApp client:", error);
//     io.emit("status", { state: "error", message: "Failed to initialize" });
//   });

//   return client;
// }

// export function getClient() {
//   return globalClient;
// }
