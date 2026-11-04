// middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const userRole = (req.auth?.user as any)?.role

  // 1. Sekatan Laluan Pentadbir (Admin Routes)
  const adminRoutes = [
    '/dashboard',
    '/bookings',
    '/staff',
    '/services',
    '/settings',
    '/audit-logs',
  ]

  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    // Jika bukan Admin, tolak ke laman utama
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // 2. Sekatan Laluan Portal Barber (/barber)
  if (pathname === '/barber' || pathname.startsWith('/barber/')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    // Hanya BARBER atau ADMIN dibenarkan masuk
    if (userRole !== 'BARBER' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // 3. Sekatan Laluan Terlindung Pelanggan (Customer Protected)
  const customerProtectedRoutes = ['/my-appointments', '/profile']
  const isCustomerProtected = customerProtectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isCustomerProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/bookings',
    '/bookings/:path*',
    '/staff',
    '/staff/:path*',
    '/services',
    '/services/:path*',
    '/settings',
    '/settings/:path*',
    '/audit-logs',
    '/audit-logs/:path*',
    '/barber',
    '/barber/:path*',
    '/my-appointments',
    '/my-appointments/:path*',
    '/profile',
    '/profile/:path*',
  ],
}
