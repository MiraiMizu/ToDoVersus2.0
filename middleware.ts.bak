import { NextRequest, NextResponse } from 'next/server'

// Edge-compatible: check for the NextAuth session cookie directly
export default function middleware(req: NextRequest) {
  const { nextUrl } = req

  const publicPaths = ['/login', '/register', '/api/auth', '/api/auth/register']
  const isPublicPath = publicPaths.some((p) => nextUrl.pathname.startsWith(p))

  // NextAuth v5 uses 'authjs.session-token' cookie name
  const sessionCookie =
    req.cookies.get('authjs.session-token') ||
    req.cookies.get('__Secure-authjs.session-token') ||
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token')

  const isLoggedIn = !!sessionCookie

  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
