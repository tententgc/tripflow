import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@tripflow/database'

export async function GET() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user
  const userSelect = { id: true, email: true, name: true, nameEn: true, phone: true, avatarUrl: true, systemRole: true, locale: true, timezone: true } as const

  let dbUser = await db.user.findUnique({ where: { email: user.email! }, select: userSelect })
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email!.split('@')[0] ?? 'Admin',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
      select: userSelect,
    })
  }

  // Allow SUPER_ADMIN always
  if (dbUser.systemRole === 'SUPER_ADMIN') {
    const res = NextResponse.json(dbUser)
    res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    return res
  }

  // Check OperatorStaff — can run in parallel with nothing, but needed sequentially after dbUser
  const staffRecord = await db.operatorStaff.findFirst({
    where: { userId: dbUser.id },
    select: { role: true, operatorId: true },
  })
  if (!staffRecord) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const res = NextResponse.json({ ...dbUser, staffRole: staffRecord.role, operatorId: staffRecord.operatorId })
  res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
  return res
}

export async function DELETE() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
