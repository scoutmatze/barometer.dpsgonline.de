import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

const publicPaths = ['/login', '/umfrage', '/live', '/beamer', '/api/auth', '/api/submit', '/api/surveys/token', '/api/live/join', '/api/live/respond', '/api/qr'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Live results endpoint (public for beamer)
  if (pathname.match(/^\/api\/live\/\d+\/results$/)) {
    return NextResponse.next();
  }

  // Static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/images') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Check auth
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};
