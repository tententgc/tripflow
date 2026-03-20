import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@tripflow/database'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let dbUser = await db.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email!.split('@')[0] ?? 'Admin',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
    })
  }

  // Allow SUPER_ADMIN always
  if (dbUser.systemRole === 'SUPER_ADMIN') {
    return NextResponse.json(dbUser)
  }

  // Check OperatorStaff
  const staffRecord = await db.operatorStaff.findFirst({ where: { userId: dbUser.id } })
  if (!staffRecord) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ ...dbUser, staffRole: staffRecord.role, operatorId: staffRecord.operatorId })
}

export async function DELETE() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
