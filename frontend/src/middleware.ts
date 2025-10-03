import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Generate nonce for CSP
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

// Rate limiting store (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, limit: number = 100, windowMs: number = 900000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  const clientData = rateLimitMap.get(ip);

  if (!clientData || clientData.resetTime < windowStart) {
    // Reset or initialize
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (clientData.count >= limit) {
    return true;
  }

  clientData.count++;
  return false;
}

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests from this IP, please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900',
          },
        }
      );
    }
  }

  // Production-ready CSP
  const csp = `
    default-src 'self';
    script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: https: blob: https://*.udigit-rentals.com https://images.unsplash.com;
    connect-src 'self' https://api.udigit-rentals.com wss://api.udigit-rentals.com https://cdn.udigit-rentals.com;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://api.udigit-rentals.com;
    frame-ancestors 'none';
    upgrade-insecure-requests;
    block-all-mixed-content;
    require-trusted-types-for 'script';
  `.replace(/\s{2,}/g, ' ').trim();

  const headers = new Headers();

  // Security headers
  headers.set('Content-Security-Policy', csp);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('X-DNS-Prefetch-Control', 'on');

  // Additional security headers
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return NextResponse.next({ headers });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
