import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Authentication Middleware (ERPNext-style)
 * 
 * Frappe's session is stored in 'sid' cookie (httpOnly).
 * We check for its presence to determine if user is authenticated.
 * 
 * Pattern from: frappe/desk.js redirect_to_login()
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/setup']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Check for Frappe session cookie (sid = session ID)
  const sid = request.cookies.get('sid')?.value
  const isAuthenticated = !!sid && sid !== 'Guest'
  
  // Protect private routes - redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    // Preserve original URL for post-login redirect (ERPNext pattern)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated user hits /login, send them to app home (Desk-style UX)
  if (isAuthenticated && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/app/home', request.url))
  }
  
  // Redirect legacy /dashboard to /app/home (ERPNext pattern)
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/app/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Match all routes except static files and API routes
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}

