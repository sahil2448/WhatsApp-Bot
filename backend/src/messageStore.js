// backend/src/messageStore.js
import fs from "fs/promises";
import path from "path";

const MESSAGES_FILE = process.env.MESSAGES_FILE || "./data/messages.json";
const DATA_DIR = path.dirname(MESSAGES_FILE);

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// In-memory store with file persistence
let messages = [];
let initialized = false;

async function initializeStore() {
  if (initialized) return;

  await ensureDataDir();

  try {
    const data = await fs.readFile(MESSAGES_FILE, "utf8");
    messages = JSON.parse(data) || [];
    console.log(`✅ Loaded ${messages.length} messages from storage`);
  } catch (error) {
    console.log("📝 Starting with empty message store");
    messages = [];
  }

  initialized = true;
}

export async function saveMessage(message) {
  await initializeStore();

  const messageWithId = {
    ...message,
    id:
      message.id ||
      `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  messages.push(messageWithId);

  // Keep only last 1000 messages to prevent file from growing too large
  if (messages.length > 1000) {
    messages = messages.slice(-1000);
  }

  // Persist to file (async, non-blocking)
  try {
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error("❌ Error saving messages:", error);
  }

  return messageWithId;
}

export async function getMessages(limit = 100) {
  await initializeStore();
  return messages.slice(-limit).reverse(); // Most recent first
}

export async function getMessageHistory(phoneNumber, limit = 10) {
  await initializeStore();

  const userMessages = messages
    .filter((msg) => msg.from === phoneNumber || msg.to === phoneNumber)
    .slice(-limit);

  return userMessages;
}

export async function getMessageStats() {
  await initializeStore();

  const totalMessages = messages.length;
  const incomingCount = messages.filter(
    (m) => m.direction === "incoming"
  ).length;
  const outgoingCount = messages.filter(
    (m) => m.direction === "outgoing"
  ).length;

  // Get unique contacts
  const contacts = new Set();
  messages.forEach((msg) => {
    if (msg.from) contacts.add(msg.from);
    if (msg.to) contacts.add(msg.to);
  });

  return {
    totalMessages,
    incomingCount,
    outgoingCount,
    uniqueContacts: contacts.size,
    todayMessages: messages.filter((msg) => {
      const msgDate = new Date(msg.timestamp || msg.createdAt);
      const today = new Date();
      return msgDate.toDateString() === today.toDateString();
    }).length,
  };
}
