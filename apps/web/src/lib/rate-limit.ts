import { NextRequest, NextResponse } from "next/server";

// Lightweight in-memory fixed-window rate limiter keyed by client IP.
// NOTE: on serverless (Vercel) each instance keeps its own memory, so this is a
// per-instance guard against a single abusive client — good as a first layer.
// For a strict global limit at scale, back this with Upstash Redis / Vercel KV.

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0].trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

// Returns a 429 NextResponse when the caller is over the limit, otherwise null.
export function enforceRateLimit(
  req: NextRequest,
  name: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
  }

  const key = `${name}:${clientIp(req)}`;
  const b = buckets.get(key);

  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (b.count >= limit) {
    const retryAfter = Math.ceil((b.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  b.count += 1;
  return null;
}
