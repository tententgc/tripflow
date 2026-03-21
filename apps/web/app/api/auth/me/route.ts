import { NextRequest, NextResponse } from 'next/server'
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
        name: user.user_metadata?.full_name ?? user.email!.split('@')[0] ?? 'ผู้ใช้',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
    })
  }

  return NextResponse.json(dbUser)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as { name?: string; phone?: string; nameEn?: string; passportNo?: string | null; passportExpiry?: string | null }

  const dbUser = await db.user.update({
    where: { email: user.email! },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.nameEn != null && { nameEn: body.nameEn }),
      ...(body.passportNo !== undefined && { passportNo: body.passportNo }),
      ...(body.passportExpiry !== undefined && { passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null }),
      ...(body.phone != null && { phone: body.phone }),
    },
  })

  return NextResponse.json(dbUser)
}
