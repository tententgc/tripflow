import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@tripflow/database'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Single query: user + staff role in one round trip
  const userWithStaff = { id: true, email: true, name: true, nameEn: true, phone: true, avatarUrl: true, systemRole: true, locale: true, timezone: true, staffRoles: { select: { role: true, operatorId: true }, take: 1 } } as const

  let dbUser = await db.user.findUnique({ where: { email: user.email! }, select: userWithStaff })
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email!.split('@')[0] ?? 'Admin',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
      select: userWithStaff,
    })
  }

  const { staffRoles, ...userFields } = dbUser

  // Allow SUPER_ADMIN always
  if (userFields.systemRole === 'SUPER_ADMIN') {
    const res = NextResponse.json(userFields)
    res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    return res
  }

  const staffRecord = staffRoles[0]
  if (!staffRecord) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const res = NextResponse.json({ ...userFields, staffRole: staffRecord.role, operatorId: staffRecord.operatorId })
  res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
  return res
}

export async function DELETE() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
