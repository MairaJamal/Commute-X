import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = [
  '/profile',
  '/create-request',
  '/matches',
  '/match-detail',
  '/chat',
  '/fare-split',
  '/confirmation',
  '/dashboard',
  '/safety',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.has('session');
  if (!hasSession) {
    const loginUrl = new URL('/signup-login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/create-request/:path*',
    '/matches/:path*',
    '/match-detail/:path*',
    '/chat/:path*',
    '/fare-split/:path*',
    '/confirmation/:path*',
    '/dashboard/:path*',
    '/safety/:path*',
  ],
};
