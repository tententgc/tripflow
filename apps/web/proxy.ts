import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Next.js 16 proxy — runs before any page renders.
 * Optimized: skips expensive Supabase call for public/static/API routes.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip auth for API routes — they handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip auth for static assets and service worker
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg' ||
    pathname === '/logo.svg'
  ) {
    return NextResponse.next()
  }

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isPublicPage = pathname === '/' || pathname.startsWith('/auth')

  // Skip expensive Supabase call for public pages
  if (isPublicPage) {
    return NextResponse.next()
  }

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // getSession() for routing only (~0ms). Security note: this does NOT verify
  // with the auth server. Actual verification happens in getAuthUser() (lib/auth.ts)
  // which calls getUser() every 5 min. A forged/revoked session gets past the proxy
  // but is caught by getAuthUser() before any data is returned.
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|logo.svg).*)'],
}
