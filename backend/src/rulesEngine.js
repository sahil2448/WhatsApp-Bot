// backend/src/rulesEngine.js
import fs from "fs/promises";

const RULES_FILE = process.env.RULES_FILE || "./data/rules.json";

// backend/src/rulesEngine.js - Enhanced rules
const defaultRules = [
  {
    id: "greeting",
    name: "Greeting Response",
    keywords: [
      "hello",
      "hi",
      "hey",
      "good morning",
      "good evening",
      "namaste",
      "hola",
    ],
    response: "Hello! 👋 Welcome to our service. How can I help you today?",
    enabled: true,
    priority: 1,
  },
  {
    id: "business_hours",
    name: "Business Hours",
    keywords: ["hours", "open", "closed", "timing", "schedule"],
    response:
      "We're available Monday to Friday, 9 AM to 6 PM IST. Outside these hours, please leave a message and we'll respond soon! 🕐",
    enabled: true,
    priority: 2,
  },
  {
    id: "pricing",
    name: "Pricing Inquiry",
    keywords: ["price", "cost", "fee", "charge", "expensive", "cheap", "rate"],
    response:
      "Thanks for your pricing inquiry! 💰 Our team will send you detailed pricing information shortly. Each solution is customized to your needs.",
    enabled: true,
    priority: 3,
  },
  {
    id: "contact",
    name: "Contact Information",
    keywords: ["contact", "phone", "email", "address", "location"],
    response:
      "📞 You can reach us here on WhatsApp, or email us at contact@yourcompany.com. We're here to help!",
    enabled: true,
    priority: 4,
  },
  {
    id: "help",
    name: "Help Request",
    keywords: ["help", "support", "assistance", "problem", "issue", "trouble"],
    response:
      "I'm here to help! 🤝 Please describe your issue in detail, and our support team will assist you as quickly as possible.",
    enabled: true,
    priority: 5,
  },
  {
    id: "thanks",
    name: "Thank You Response",
    keywords: ["thank", "thanks", "appreciate", "grateful"],
    response:
      "You're very welcome! 😊 Is there anything else I can help you with today?",
    enabled: true,
    priority: 6,
  },
  {
    id: "goodbye",
    name: "Farewell Response",
    keywords: ["bye", "goodbye", "see you", "farewell", "later", "talk soon"],
    response:
      "Goodbye! Have a wonderful day! 👋 Feel free to reach out anytime you need assistance.",
    enabled: true,
    priority: 7,
  },
];

// Rest of the rulesEngine.js code stays the same...

let rules = [];
let initialized = false;

async function initializeRules() {
  if (initialized) return;

  try {
    const data = await fs.readFile(RULES_FILE, "utf8");
    rules = JSON.parse(data) || defaultRules;
    console.log(`✅ Loaded ${rules.length} rules`);
  } catch (error) {
    console.log("📝 Loading default rules");
    rules = [...defaultRules];
    await saveRules();
  }

  initialized = true;
}

async function saveRules() {
  try {
    await fs.writeFile(RULES_FILE, JSON.stringify(rules, null, 2));
  } catch (error) {
    console.error("❌ Error saving rules:", error);
  }
}

export async function evaluateRules(message, phoneNumber) {
  await initializeRules();

  const messageText = message.toLowerCase();

  // Find matching rule (highest priority first)
  const matchingRule = rules
    .filter((rule) => rule.enabled)
    .sort((a, b) => a.priority - b.priority)
    .find((rule) =>
      rule.keywords.some((keyword) =>
        messageText.includes(keyword.toLowerCase())
      )
    );

  if (matchingRule) {
    console.log(`📋 Rule matched: ${matchingRule.name}`);
    return matchingRule.response;
  }

  return null; // No rule matched, will use LLM
}

export async function getRules() {
  await initializeRules();
  return rules;
}

export async function addRule(rule) {
  await initializeRules();

  const newRule = {
    id: rule.id || `rule_${Date.now()}`,
    name: rule.name,
    keywords: rule.keywords || [],
    response: rule.response,
    enabled: rule.enabled !== false,
    priority: rule.priority || rules.length + 1,
    createdAt: new Date().toISOString(),
  };

  rules.push(newRule);
  await saveRules();
  return newRule;
}

export async function updateRule(ruleId, updates) {
  await initializeRules();

  const index = rules.findIndex((rule) => rule.id === ruleId);
  if (index === -1) throw new Error("Rule not found");

  rules[index] = {
    ...rules[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveRules();
  return rules[index];
}

export async function deleteRule(ruleId) {
  await initializeRules();

  const index = rules.findIndex((rule) => rule.id === ruleId);
  if (index === -1) throw new Error("Rule not found");

  rules.splice(index, 1);
  await saveRules();
  return true;
}
