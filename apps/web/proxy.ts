import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Next.js 16 proxy — runs before any page renders.
 * Uses getSession() (local JWT decode, ~1ms) instead of getUser() (~150ms network call).
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip auth check for API routes — they handle their own auth
  if (pathname.startsWith('/api/')) {
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

  // getSession() decodes JWT locally (~1ms) vs getUser() which calls Supabase server (~150ms)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session?.user && isAuthPage) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|logo.svg).*)'],
}
