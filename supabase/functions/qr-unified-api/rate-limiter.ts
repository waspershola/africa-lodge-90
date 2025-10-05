// In-memory rate limiter (for production, use Redis/Upstash)

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  validate: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  request: { maxRequests: 20, windowMs: 60000 }, // 20 per minute
  general: { maxRequests: 60, windowMs: 60000 }, // 60 per minute
};

export function checkRateLimit(
  identifier: string,
  endpoint: string = 'general'
): { allowed: boolean; remainingRequests?: number; resetAt?: number } {
  const config = DEFAULT_LIMITS[endpoint] || DEFAULT_LIMITS.general;
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    // Create new record
    const newRecord = { count: 1, resetAt: now + config.windowMs };
    rateLimitStore.set(key, newRecord);
    return { 
      allowed: true, 
      remainingRequests: config.maxRequests - 1,
      resetAt: newRecord.resetAt 
    };
  }
  
  if (record.count >= config.maxRequests) {
    return { 
      allowed: false, 
      remainingRequests: 0,
      resetAt: record.resetAt 
    };
  }
  
  record.count++;
  return { 
    allowed: true, 
    remainingRequests: config.maxRequests - record.count,
    resetAt: record.resetAt 
  };
}

export function getClientIdentifier(req: Request): string {
  // Try to get real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  return cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
}
