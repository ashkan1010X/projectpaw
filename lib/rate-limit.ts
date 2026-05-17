import { supabaseAdmin } from '@/lib/supabase-admin';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface CheckParams {
  bucket: string;
  identifier: string;
  max: number;
  windowMinutes: number;
}

/**
 * Sliding-window rate limiter backed by Supabase `auth_rate_limits`.
 *
 * - Counts hits in `bucket` for `identifier` over the last `windowMinutes`
 * - Records the new attempt only if allowed (so blocked attempts don't
 *   extend the window — same behaviour as GitHub/Stripe)
 * - Returns Retry-After in seconds based on the oldest hit in the window
 */
export async function checkRateLimit({
  bucket,
  identifier,
  max,
  windowMinutes,
}: CheckParams): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  // Fetch the timestamps of recent hits — we need the oldest for Retry-After
  const { data, error } = await supabaseAdmin
    .from('auth_rate_limits')
    .select('created_at')
    .eq('bucket', bucket)
    .eq('identifier', identifier)
    .gte('created_at', windowStart.toISOString())
    .order('created_at', { ascending: true })
    .limit(max + 1);

  if (error) {
    // Fail OPEN on infrastructure errors — better to let a legit user through
    // than to lock everyone out if the rate-limit table is unreachable.
    console.error('[rate-limit] lookup failed, failing open:', error.message);
    return { allowed: true, remaining: max, retryAfterSeconds: 0 };
  }

  const hits = data?.length ?? 0;

  if (hits >= max) {
    const oldest = data![0].created_at as string;
    const oldestMs = new Date(oldest).getTime();
    const windowEndsAt = oldestMs + windowMinutes * 60 * 1000;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowEndsAt - Date.now()) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  // Record the hit — non-blocking write; if it fails we still allow the request
  void supabaseAdmin
    .from('auth_rate_limits')
    .insert({ bucket, identifier })
    .then(({ error: insertErr }) => {
      if (insertErr) console.error('[rate-limit] insert failed:', insertErr.message);
    });

  return { allowed: true, remaining: max - hits - 1, retryAfterSeconds: 0 };
}

/**
 * Extract the client IP from a Next.js request.
 * Tries common proxy headers in order, falls back to a sentinel.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return (
    headers.get('x-real-ip') ??
    headers.get('cf-connecting-ip') ??
    headers.get('x-vercel-forwarded-for') ??
    'unknown'
  );
}
