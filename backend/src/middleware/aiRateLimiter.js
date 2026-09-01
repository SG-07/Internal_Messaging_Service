// backend/src/middleware/aiRateLimiter.js

const RATE_LIMIT = 5; // requests per window, per user
const WINDOW_MS = 60 * 1000; // 1 minute

const requestLog = new Map(); // user_id -> { count, windowStart }

export function aiRateLimiter(req, res, next) {
  const userId = req.user?.id;

  if (!userId) {
    // requireAuth should already have blocked unauthenticated requests
    // before this middleware runs; this is a defensive fallback only.
    return next();
  }

  const now = Date.now();
  const entry = requestLog.get(userId);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    requestLog.set(userId, { count: 1, windowStart: now });
    return next();
  }

  if (entry.count >= RATE_LIMIT) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000);

    return res.status(429).json({
      success: false,
      message: `Too many AI requests. Try again in ${retryAfterSeconds}s.`,
    });
  }

  entry.count += 1;
  next();
}