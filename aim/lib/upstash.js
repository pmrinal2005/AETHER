import { Redis } from '@upstash/redis';

// Upstash Redis (server-side only). Responsibilities are explicitly separated:
//   • Upstash  → cross-service / external-subscriber pub/sub broadcast
//                (e.g. the `revocation-bus` channel other registries listen on)
//   • Supabase Realtime → in-app live UI updates
//
// Upstash REST API does not hold a long-lived SUBSCRIBE socket, so we model the
// "revocation-bus" as (a) a durable event log list + (b) a fan-out publish that
// external HTTP subscribers can long-poll. This keeps everything on the free tier
// with no always-on server (Vercel serverless friendly).
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const isUpstashConfigured = Boolean(url && token);

export function getRedis() {
  if (!isUpstashConfigured) return null;
  return new Redis({ url, token });
}

export const REVOCATION_BUS = 'revocation-bus';

// Publish an event to the revocation bus (append to a capped log + bump a counter).
export async function publishRevocation(event) {
  const redis = getRedis();
  if (!redis) return { ok: false, reason: 'upstash-not-configured' };
  const payload = JSON.stringify({ ...event, ts: Date.now() });
  await redis.lpush(REVOCATION_BUS, payload);
  await redis.ltrim(REVOCATION_BUS, 0, 199); // keep last 200 events
  await redis.incr(`${REVOCATION_BUS}:seq`);
  return { ok: true };
}

// Read recent revocation-bus events (for external subscribers / demo panel).
export async function readRevocationEvents(count = 20) {
  const redis = getRedis();
  if (!redis) return [];
  const raw = await redis.lrange(REVOCATION_BUS, 0, count - 1);
  return raw.map((r) => {
    try {
      return typeof r === 'string' ? JSON.parse(r) : r;
    } catch {
      return r;
    }
  });
}
