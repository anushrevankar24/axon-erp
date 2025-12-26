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
  const publicRoutes = ['/login', '/signup']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Check for Frappe session cookie (sid = session ID)
  const sessionCookie = request.cookies.get('sid')
  const isAuthenticated = !!sessionCookie?.value
  
  // Protect private routes - redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    // Preserve original URL for post-login redirect (ERPNext pattern)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Prevent authenticated users from accessing login page
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  // Match all routes except static files and API routes
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}

