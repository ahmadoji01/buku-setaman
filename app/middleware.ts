import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt-utils'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/modules',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    const token = request.cookies.get('auth-token')?.value

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      // Token is invalid or expired, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.set('auth-token', '', { maxAge: 0, path: '/' })
      return response
    }

    // Token is valid, allow request to proceed
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/modules/:path*',
  ],
}