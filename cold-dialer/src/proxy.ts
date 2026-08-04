import { NextRequest, NextResponse } from 'next/server';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * This app has no login (it's a single-user, localhost-only tool), so
 * there's no session cookie for a malicious page in another browser tab
 * to ride. But without this check, ANY webpage the user has open could
 * still blind-POST to http://127.0.0.1:3000/api/* — e.g. mass-marking
 * leads Do Not Call, or writing bogus call notes — since fetch() sends
 * simple cross-origin requests before CORS blocks the attacker from
 * reading the response. Browsers attach an Origin header to every
 * state-changing request (same-origin or not), so rejecting mismatches
 * closes that off while leaving normal use of the app untouched.
 */
export function proxy(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return NextResponse.next();

  const origin = req.headers.get('origin');
  if (!origin) return NextResponse.next();

  // Compare against the Host header actually sent, not req.nextUrl.origin
  // (which Next.js can normalize to "localhost" regardless of the host
  // the request was actually addressed to, making it unreliable here).
  const host = req.headers.get('host');
  let originHost: string | null = null;
  try {
    originHost = new URL(origin).host;
  } catch {
    // Malformed Origin header — treat as untrusted.
  }

  if (!host || originHost !== host) {
    return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
