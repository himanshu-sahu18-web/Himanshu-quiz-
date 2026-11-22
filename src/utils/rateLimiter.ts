export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  burstWindowMs?: number;
  burstMaxRequests?: number;
  maxTrackedKeys?: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  reason?: 'burst' | 'window';
}

interface BucketRecord {
  timestamps: number[];
  lastSeen: number;
}

export class SlidingWindowRateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly burstWindowMs: number;
  private readonly burstMaxRequests: number;
  private readonly maxTrackedKeys: number;
  private readonly buckets = new Map<string, BucketRecord>();
  private checkCounter = 0;

  constructor(options: RateLimiterOptions) {
    this.windowMs = Math.max(1000, options.windowMs);
    this.maxRequests = Math.max(1, options.maxRequests);
    this.burstWindowMs = Math.max(1000, options.burstWindowMs ?? this.windowMs);
    this.burstMaxRequests = Math.max(1, options.burstMaxRequests ?? this.maxRequests);
    this.maxTrackedKeys = Math.max(64, options.maxTrackedKeys ?? 10000);
  }

  check(key: string, now = Date.now()): RateLimitDecision {
    const normalizedKey = key.trim() || 'unknown';
    this.checkCounter += 1;
    if (this.checkCounter % 100 === 0 || this.buckets.size >= this.maxTrackedKeys) {
      this.prune(now);
    }

    const windowCutoff = now - this.windowMs;
    const burstCutoff = now - this.burstWindowMs;

    let record = this.buckets.get(normalizedKey);
    if (!record) {
      if (this.buckets.size >= this.maxTrackedKeys) {
        const oldestKey = this.buckets.keys().next().value;
        if (oldestKey !== undefined) {
          this.buckets.delete(oldestKey);
        }
      }
      record = { timestamps: [], lastSeen: now };
      this.buckets.set(normalizedKey, record);
    }

    // Drop timestamps outside the main sliding window
    const activeTimestamps = record.timestamps.filter((ts) => ts > windowCutoff);
    record.timestamps = activeTimestamps;
    record.lastSeen = now;

    if (activeTimestamps.length >= this.maxRequests) {
      const oldestInWindow = activeTimestamps[0];
      const retryMs = Math.max(1000, oldestInWindow + this.windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(retryMs / 1000),
        reason: 'window',
      };
    }

    const burstTimestamps = activeTimestamps.filter((ts) => ts > burstCutoff);
    if (burstTimestamps.length >= this.burstMaxRequests) {
      const oldestInBurst = burstTimestamps[0];
      const retryMs = Math.max(1000, oldestInBurst + this.burstWindowMs - now);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(retryMs / 1000),
        reason: 'burst',
      };
    }

    activeTimestamps.push(now);
    const remainingWindow = this.maxRequests - activeTimestamps.length;
    const remainingBurst = this.burstMaxRequests - (burstTimestamps.length + 1);

    return {
      allowed: true,
      remaining: Math.max(0, Math.min(remainingWindow, remainingBurst)),
      retryAfterSeconds: 0,
    };
  }

  prune(now = Date.now()): void {
    const cutoff = now - this.windowMs;
    for (const [key, record] of this.buckets.entries()) {
      if (record.lastSeen <= cutoff) {
        this.buckets.delete(key);
      }
    }
  }

  get trackedKeyCount(): number {
    return this.buckets.size;
  }
}

export function extractClientIp(headers: {
  forwardedFor?: string | string[];
  expressIp?: string;
  remoteAddress?: string;
}): string {
  if (headers.expressIp && headers.expressIp.trim()) {
    return headers.expressIp.trim();
  }
  const forwarded = Array.isArray(headers.forwardedFor)
    ? headers.forwardedFor[0]
    : headers.forwardedFor;
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const firstHop = forwarded.split(',')[0]?.trim();
    if (firstHop) return firstHop;
  }
  if (headers.remoteAddress && headers.remoteAddress.trim()) {
    return headers.remoteAddress.trim();
  }
  return 'unknown';
}
