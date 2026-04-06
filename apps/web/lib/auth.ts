import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@tripflow/database'
import { getCached, setCache } from '@/lib/cache'

const USER_SELECT = {
  id: true, name: true, nameEn: true, email: true, phone: true,
  avatarUrl: true, passportNo: true, passportExpiry: true,
} as const

type DbUser = {
  id: string; name: string; nameEn: string | null; email: string;
  phone: string | null; avatarUrl: string | null;
  passportNo: string | null; passportExpiry: Date | null;
}

/**
 * Auth strategy: read email from JWT cookie directly (no Supabase client,
 * no getSession() warning), then verify with getUser() every 5 min.
 *
 * → 95% of requests: ~0ms (JWT decode + cache hit)
 * → Every 5 min per token: ~200ms (getUser() auth server check)
 * → Revoked sessions detected within 5 minutes
 */
const verifiedTokens = new Map<string, { email: string; at: number }>()
const VERIFY_TTL = 5 * 60_000

/** Extract Supabase project ref from URL (e.g. "abcdef" from "https://abcdef.supabase.co") */
const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/\/\/([^.]+)/)?.[1] ?? ''

/** Read email from JWT cookie without Supabase client — avoids getSession() warning */
function readEmailFromJwt(cookieStore: Awaited<ReturnType<typeof cookies>>): { email: string | null; tokenKey: string | null } {
  const baseName = `sb-${PROJECT_REF}-auth-token`

  // Try single cookie, then chunked format (@supabase/ssr splits large cookies)
  let raw = cookieStore.get(baseName)?.value
  if (!raw) {
    const chunks: string[] = []
    for (let i = 0; i < 10; i++) {
      const chunk = cookieStore.get(`${baseName}.${i}`)?.value
      if (!chunk) break
      chunks.push(chunk)
    }
    if (chunks.length) raw = chunks.join('')
  }
  if (!raw) return { email: null, tokenKey: null }

  try {
    // @supabase/ssr 0.9+ default encoding is base64url with "base64-" prefix
    let jsonStr = raw
    if (raw.startsWith('base64-')) {
      jsonStr = Buffer.from(raw.substring(7), 'base64url').toString()
    }
    const session = JSON.parse(jsonStr)
    const accessToken: string | undefined = session.access_token
    if (!accessToken) return { email: null, tokenKey: null }
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1]!, 'base64url').toString())
    return { email: payload.email ?? null, tokenKey: accessToken.substring(0, 32) }
  } catch {
    return { email: null, tokenKey: null }
  }
}

async function getSessionEmail(): Promise<string | null> {
  // Step 1: Read email from JWT cookie directly (~0ms, no Supabase client)
  const cookieStore = await cookies()
  const { email, tokenKey } = readEmailFromJwt(cookieStore)
  if (!email || !tokenKey) return null

  // Step 2: Check if this token was recently verified with auth server
  const cached = verifiedTokens.get(tokenKey)
  if (cached && Date.now() - cached.at < VERIFY_TTL) return cached.email

  // Step 3: Verify with Supabase auth server (~200ms, every 5 min per token)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    verifiedTokens.delete(tokenKey)
    return null // session was revoked
  }

  verifiedTokens.set(tokenKey, { email: user.email, at: Date.now() })
  // Prevent unbounded growth
  if (verifiedTokens.size > 200) {
    const oldest = [...verifiedTokens.entries()].sort((a, b) => a[1].at - b[1].at)
    for (let i = 0; i < 50; i++) verifiedTokens.delete(oldest[i]![0])
  }
  return user.email
}

/**
 * Get the current authenticated user with DB record.
 * Two-layer cache:
 *   1. Email lookup: Supabase auth (unavoidable on cold, but proxy.ts already verified)
 *   2. DB user: cached for 120s keyed by email
 */
export async function getAuthUser(): Promise<DbUser | null> {
  const email = await getSessionEmail()
  if (!email) return null

  const cacheKey = `dbuser:${email}`
  const cached = getCached<DbUser>(cacheKey)
  if (cached) return cached

  let dbUser = await db.user.findUnique({
    where: { email },
    select: USER_SELECT,
  })

  if (!dbUser) {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    dbUser = await db.user.create({
      data: {
        email,
        name: authUser?.user_metadata?.full_name ?? email.split('@')[0] ?? 'ผู้ใช้',
        avatarUrl: authUser?.user_metadata?.avatar_url ?? null,
      },
      select: USER_SELECT,
    })
  }

  setCache(cacheKey, dbUser, 120_000) // 2 min cache — auth doesn't change often
  return dbUser
}

/**
 * Lightweight version — only returns id, name, email.
 */
export async function getAuthUserLight(): Promise<{ id: string; name: string; email: string } | null> {
  const email = await getSessionEmail()
  if (!email) return null

  const cacheKey = `dbuser-light:${email}`
  const cached = getCached<{ id: string; name: string; email: string }>(cacheKey)
  if (cached) return cached

  const dbUser = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  })
  if (!dbUser) return null

  setCache(cacheKey, dbUser, 120_000)
  return dbUser
}
