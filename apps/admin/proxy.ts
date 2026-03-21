import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip for API routes, auth callback, static assets
  if (pathname.startsWith('/api/') || pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  const isLoginPage = pathname.startsWith('/login')

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // getSession() decodes JWT locally (~1ms) vs getUser() (~150ms network call)
  const w = console.warn; console.warn = () => {}
  const { data: { session } } = await supabase.auth.getSession()
  console.warn = w

  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|logo).*)'],
}
