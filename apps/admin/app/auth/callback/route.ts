import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Next.js standalone (Docker) builds req.url from the HOSTNAME env, not the
// incoming Host header. With HOSTNAME=0.0.0.0 that poisons OAuth redirects
// with http://0.0.0.0:3001. Reconstruct origin from proxy-forwarded headers
// so Render / Vercel / local all resolve to the URL the browser used.
function originFromRequest(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  return host ? `${proto}://${host}` : new URL(req.url).origin
}

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get('code')
  const origin = originFromRequest(req)

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
