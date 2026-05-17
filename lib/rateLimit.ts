interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

// Defaults: 10 batch requests per hour per IP.
// Override via env: RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '5', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? String(60 * 60 * 1000), 10);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + WINDOW_MS };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.windowStart + WINDOW_MS };
}

// Periodic cleanup to avoid unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart >= WINDOW_MS * 2) store.delete(key);
  }
}, WINDOW_MS);
