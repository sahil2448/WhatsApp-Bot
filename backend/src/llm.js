// // backend/src/llm.js
// import OpenAI from "openai";
// import { getMessageHistory } from "./messageStore.js";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const SYSTEM_PROMPT = `You are a helpful WhatsApp assistant. Keep your responses:
// - Short and conversational (max 2-3 sentences)
// - Friendly and professional
// - Relevant to the user's question
// - In the same language as the user's message

// If you don't understand something, ask for clarification politely.`;

// export async function generateReply(userMessage, phoneNumber) {
//   try {
//     // Get conversation context (last 5 messages)
//     const history = await getMessageHistory(phoneNumber, 5);

//     const messages = [{ role: "system", content: SYSTEM_PROMPT }];

//     // Add conversation history for context
//     history.forEach((msg) => {
//       messages.push({
//         role: msg.direction === "incoming" ? "user" : "assistant",
//         content: msg.body,
//       });
//     });

//     // Add current message
//     messages.push({
//       role: "user",
//       content: userMessage,
//     });

//     const response = await openai.chat.completions.create({
//       model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
//       messages: messages,
//       max_tokens: 150,
//       temperature: 0.7,
//     });

//     return (
//       response.choices[0]?.message?.content?.trim() ||
//       "I'm sorry, I couldn't process that message."
//     );
//   } catch (error) {
//     console.error("❌ LLM Error:", error);
//     return "I'm experiencing some technical difficulties. Please try again later.";
//   }
// }

// backend/src/llm.js - NO OpenAI needed!
const fallbackResponses = [
  "Thanks for your message! Our team will get back to you soon.",
  "I understand you're looking for help. Let me connect you with the right person.",
  "I appreciate you reaching out! Could you provide more details about what you need?",
  "Thank you for contacting us! We'll respond as quickly as possible.",
  "I'm here to help! Can you tell me more about your question?",
  "Thanks for your patience! Our team will assist you shortly.",
];

const contextualResponses = {
  // Business inquiries
  business: [
    "Thank you for your business inquiry! Our team will contact you within 24 hours.",
    "We appreciate your interest in our services. Someone will reach out to you soon.",
  ],

  // Support requests
  support: [
    "I understand you need support. We're here to help! Please describe your issue in detail.",
    "Our support team has received your request. We'll get back to you as soon as possible.",
  ],

  // Questions
  questions: [
    "That's a great question! Let me connect you with someone who can provide the best answer.",
    "Thanks for asking! Our team will provide you with detailed information shortly.",
  ],

  // Greetings (already in rules)
  default: fallbackResponses,
};

export async function generateReply(userMessage, phoneNumber) {
  try {
    console.log("🤖 Generating smart rule-based response...");

    const messageText = userMessage.toLowerCase();

    // Context detection
    let context = "default";

    if (
      messageText.includes("business") ||
      messageText.includes("service") ||
      messageText.includes("price") ||
      messageText.includes("cost")
    ) {
      context = "business";
    } else if (
      messageText.includes("help") ||
      messageText.includes("support") ||
      messageText.includes("problem") ||
      messageText.includes("issue")
    ) {
      context = "support";
    } else if (
      messageText.includes("?") ||
      messageText.includes("how") ||
      messageText.includes("what") ||
      messageText.includes("when") ||
      messageText.includes("where")
    ) {
      context = "questions";
    }

    // Get appropriate response array
    const responses = contextualResponses[context] || fallbackResponses;

    // Random selection for variety
    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    console.log(`📝 Context: ${context}, Response: ${randomResponse}`);

    return randomResponse;
  } catch (error) {
    console.error("❌ Smart Response Error:", error);
    return "Thank you for your message! We'll get back to you soon.";
  }
}
