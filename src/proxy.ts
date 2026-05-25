import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Auth0 handles /auth/* routes — run its proxy and return early
  if (pathname.startsWith('/auth')) {
    return auth0.middleware(req)
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Apply next-intl locale routing (detects locale, redirects if missing)
  const intlResponse = intlMiddleware(req)
  if (intlResponse.status !== 200) {
    return intlResponse
  }

  // Locale is present in URL; apply auth checks
  const segments = pathname.split('/')
  const firstSegment = segments[1]
  const isLandingRoute = pathname === `/${firstSegment}` || pathname === `/${firstSegment}/`

  const authRes = await auth0.middleware(req)

  // Propagate the locale header so server components can read it via headers()
  const localeHeader = intlResponse.headers.get('X-NEXT-INTL-LOCALE')
  if (localeHeader) {
    authRes.headers.set('X-NEXT-INTL-LOCALE', localeHeader)
  }

  // Propagate the locale cookie so the browser persists the chosen locale
  for (const value of intlResponse.headers.getSetCookie()) {
    authRes.headers.append('Set-Cookie', value)
  }

  if (isLandingRoute) {
    return authRes
  }

  const isJoinRoute = /^\/[a-z]{2}\/join\//.test(pathname)

  const session = await auth0.getSession(req)
  if (!session && !isJoinRoute) {
    return NextResponse.redirect(new URL('/auth/login?returnTo=' + encodeURIComponent(pathname), req.url))
  }

  return authRes
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|manifest\\.webmanifest|icon-.*\\.svg|.*\\.png).*)'],
}
