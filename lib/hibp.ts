/**
 * HaveIBeenPwned password breach check (k-anonymity).
 *
 * Same protection as Supabase Pro / 1Password / Apple Keychain — we hash the
 * password locally with SHA-1, send only the first 5 chars of the hash to
 * the HIBP API, and check the response locally. The raw password never
 * leaves the device/server. Privacy-preserving by design.
 *
 * Works in both Node (server routes) and browsers (client components)
 * via the standard Web Crypto API.
 *
 * Docs: https://haveibeenpwned.com/API/v3#PwnedPasswords
 */

export interface HibpResult {
  pwned: boolean;
  breachCount: number;
}

async function sha1Hex(text: string): Promise<string> {
  const buffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export async function isPasswordPwned(password: string): Promise<HibpResult> {
  if (!password || password.length < 1) return { pwned: false, breachCount: 0 };

  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      // Add-Padding makes all responses uniform length — defeats traffic-analysis
      // attacks that could otherwise narrow down the prefix bucket.
      headers: { 'Add-Padding': 'true' },
      // 3s timeout via AbortController — fail open if HIBP is slow
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { pwned: false, breachCount: 0 };

    const body = await res.text();
    for (const line of body.split('\n')) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return { pwned: true, breachCount: parseInt(count, 10) || 1 };
      }
    }
    return { pwned: false, breachCount: 0 };
  } catch {
    // Fail OPEN — if HIBP is unreachable, don't block legit signups.
    // Better UX than a hard fail when the third-party API hiccups.
    return { pwned: false, breachCount: 0 };
  }
}
