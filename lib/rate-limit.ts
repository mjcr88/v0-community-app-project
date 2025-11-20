import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a random identifier for the current instance
// In a real app, this might be the server region or instance ID
const cache = new Map();

// Initialize Redis client
// We use a try/catch block to handle cases where env vars are missing
let redis: Redis | null = null;
try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    }
} catch (error) {
    console.warn("Failed to initialize Upstash Redis for rate limiting:", error);
}

// Create a new ratelimiter, that allows 10 requests per 10 seconds
// This is a default, but we'll allow overriding it
export async function rateLimit(
    identifier: string,
    limit: number = 10,
    window: `${number} s` | `${number} m` | `${number} h` | `${number} d` = "10 s"
) {
    // If Redis is not configured, we'll skip rate limiting (or use in-memory for dev)
    // For now, we'll just log a warning and allow the request if in dev
    if (!redis) {
        if (process.env.NODE_ENV === "production") {
            console.warn("Rate limiting disabled: UPSTASH_REDIS_REST_URL not set");
        }
        return { success: true, limit, remaining: limit, reset: Date.now() };
    }

    const ratelimit = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(limit, window),
        analytics: true,
        prefix: "@upstash/ratelimit",
        ephemeralCache: cache,
    });

    return await ratelimit.limit(identifier);
}
