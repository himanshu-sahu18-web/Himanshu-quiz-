import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SlidingWindowRateLimiter,
  extractClientIp,
} from './rateLimiter.ts';

test('allows normal requests within burst and sliding window limits', () => {
  const limiter = new SlidingWindowRateLimiter({
    windowMs: 60_000,
    maxRequests: 10,
    burstWindowMs: 5_000,
    burstMaxRequests: 4,
  });

  const t0 = 1_000_000;
  for (let i = 0; i < 4; i += 1) {
    const res = limiter.check('203.0.113.10', t0 + i * 200);
    assert.equal(res.allowed, true);
  }

  // 5th rapid request within 5s trips burst cap
  const blocked = limiter.check('203.0.113.10', t0 + 900);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'burst');
  assert.ok(blocked.retryAfterSeconds >= 1);

  // Different IP remains unaffected
  const otherIp = limiter.check('203.0.113.11', t0 + 900);
  assert.equal(otherIp.allowed, true);
});

test('enforces sustained window limit and recovers once window expires', () => {
  const limiter = new SlidingWindowRateLimiter({
    windowMs: 60_000,
    maxRequests: 5,
    burstWindowMs: 5_000,
    burstMaxRequests: 5,
  });

  const t0 = 2_000_000;
  for (let i = 0; i < 5; i += 1) {
    assert.equal(limiter.check('198.51.100.7', t0 + i * 6_000).allowed, true);
  }

  const windowBlocked = limiter.check('198.51.100.7', t0 + 35_000);
  assert.equal(windowBlocked.allowed, false);
  assert.equal(windowBlocked.reason, 'window');
  assert.ok(windowBlocked.retryAfterSeconds > 0);

  // Once t0 slides past 60s, a slot reopens
  const recovered = limiter.check('198.51.100.7', t0 + 60_500);
  assert.equal(recovered.allowed, true);
});

test('evicts stale/oldest keys to keep tracked key count bounded', () => {
  const limiter = new SlidingWindowRateLimiter({
    windowMs: 10_000,
    maxRequests: 5,
    maxTrackedKeys: 64,
  });

  const t0 = 3_000_000;
  for (let i = 0; i < 120; i += 1) {
    limiter.check(`10.0.0.${i}`, t0 + i);
  }

  assert.ok(limiter.trackedKeyCount <= 64);
});

test('extracts client IP safely from proxy or socket info', () => {
  assert.equal(
    extractClientIp({ expressIp: '192.0.2.5', forwardedFor: '10.0.0.1' }),
    '192.0.2.5',
  );
  assert.equal(
    extractClientIp({ forwardedFor: '203.0.113.9, 10.1.0.2' }),
    '203.0.113.9',
  );
  assert.equal(extractClientIp({ remoteAddress: '127.0.0.1' }), '127.0.0.1');
  assert.equal(extractClientIp({}), 'unknown');
});
