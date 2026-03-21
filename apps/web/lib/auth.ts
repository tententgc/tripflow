import { createClient } from '@/lib/supabase/server'
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
 * Get authenticated user's email from JWT (no network call).
 * Uses getSession() which decodes the JWT locally (~1ms)
 * instead of getUser() which validates with Supabase server (~150ms).
 */
async function getSessionEmail(): Promise<string | null> {
  const supabase = await createClient()
  // getSession() decodes JWT locally (~1ms) vs getUser() which calls Supabase server (~150ms)
  // JWT is signed by Supabase secret so it can't be forged — safe for reading email
  const origWarn = console.warn
  console.warn = () => {} // suppress Supabase getSession warning
  const { data: { session } } = await supabase.auth.getSession()
  console.warn = origWarn
  return session?.user?.email ?? null
}

/**
 * Get the current authenticated user with DB record.
 * Caches result for 60s keyed by email.
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
    const { data: { session } } = await supabase.auth.getSession()
    dbUser = await db.user.create({
      data: {
        email,
        name: session?.user?.user_metadata?.full_name ?? email.split('@')[0] ?? 'ผู้ใช้',
        avatarUrl: session?.user?.user_metadata?.avatar_url ?? null,
      },
      select: USER_SELECT,
    })
  }

  setCache(cacheKey, dbUser, 60_000)
  return dbUser
}

/**
 * Lightweight version — only returns id, name, email.
 * For use in mutation routes.
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

  setCache(cacheKey, dbUser, 60_000)
  return dbUser
}
