import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isAuthenticated(req: NextRequest): boolean {
  const cookie = req.headers.get('cookie') ?? '';
  return /admin=true/.test(cookie);
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const protectedPaths = ['/dashboard', '/pos', '/products', '/orders'];
  const needsAuth = protectedPaths.some((p) => path === p || path.startsWith(p + '/'));

  if (needsAuth && !isAuthenticated(req)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pos/:path*',
    '/products/:path*',
    '/orders/:path*',
  ],
};
