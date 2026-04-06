import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register'];
const MANAGER_ROUTES = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth from cookie (set by client) or allow public routes
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // For client-side Zustand state, we rely on ProtectedRoute component
  // Middleware only handles basic path rewrites
  if (pathname === '/') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
