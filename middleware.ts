import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
  throw new Error('JWT_SECRET is not defined in middleware');
}

const secret = new TextEncoder().encode(secretKey);

// Only these exact page paths are reachable without a session. Every other
// page defaults to requiring authentication — a new route is protected
// automatically instead of relying on someone remembering to allowlist it.
const PUBLIC_PAGE_ROUTES = ['/', '/login', '/admin/login'];

// Auth endpoints must stay reachable before a session cookie exists.
const PUBLIC_API_PREFIX = '/api/auth';

// Routes that require an ADMIN session specifically (matched by prefix).
// The leaderboard is admin-only — participants get their own rank via
// /api/results/me, never the full standings.
const ADMIN_ONLY_ROUTES = ['/admin', '/leaderboard', '/ui-preview'];

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Auth endpoints (login/logout/me) must work pre-session.
  if (pathname.startsWith(PUBLIC_API_PREFIX)) {
    return NextResponse.next();
  }

  // Every other API route enforces its own auth via requireAuthentication /
  // requireAdmin at the route level.
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // A small, explicit set of public pages.
  if (PUBLIC_PAGE_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Everything else requires a valid session — default-deny.
  const isAdminArea = ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route));
  const loginPath = isAdminArea ? '/admin/login' : '/login';

  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const session = await verifyToken(sessionCookie);
  if (!session) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (isAdminArea && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
