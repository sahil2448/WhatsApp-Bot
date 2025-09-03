// backend/src/utils/rateLimiter.js

// Simple in-memory rate limiter
// In production, use Redis for distributed rate limiting
const userLimits = new Map();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 10; // Max 10 messages per minute per user

export function checkRateLimit(phoneNumber) {
  const now = Date.now();
  const userKey = phoneNumber;

  if (!userLimits.has(userKey)) {
    userLimits.set(userKey, { count: 1, windowStart: now });
    return true;
  }

  const userLimit = userLimits.get(userKey);

  // Reset window if expired
  if (now - userLimit.windowStart > RATE_LIMIT_WINDOW) {
    userLimit.count = 1;
    userLimit.windowStart = now;
    return true;
  }

  // Check if under limit
  if (userLimit.count < MAX_MESSAGES_PER_WINDOW) {
    userLimit.count++;
    return true;
  }

  console.log(`⏳ Rate limit exceeded for ${phoneNumber}`);
  return false;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of userLimits.entries()) {
    if (now - limit.windowStart > RATE_LIMIT_WINDOW * 2) {
      userLimits.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);
