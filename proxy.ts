import { NextRequest, NextResponse } from 'next/server';

const LOGIN_PATH = '/login';
const COOKIE_NAME = 'ttb_auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for login page and API routes
  if (pathname === LOGIN_PATH || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(COOKIE_NAME);
  if (authCookie?.value === process.env.APP_PASSWORD) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
