import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages accessibles uniquement au rôle "direction"
const DIRECTION_ONLY = ['/users', '/invoices'];

function decodeRole(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les routes publiques (login, assets, api proxy, etc.)
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;

  // Pas de token → login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = decodeRole(token);

  // Token invalide → login
  if (!role) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Page direction-only et utilisateur non-direction → dashboard
  if (DIRECTION_ONLY.some(p => pathname.startsWith(p)) && role !== 'direction') {
    const dashUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf :
     * - _next/static (assets statiques)
     * - _next/image (optimisation image)
     * - favicon
     * - login
     */
    '/((?!_next/static|_next/image|favicon.ico|login).*)',
  ],
};
