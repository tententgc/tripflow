import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@tripflow/database'
import { getAuthUser } from '@/lib/auth'
import { invalidateCache } from '@/lib/cache'

const CACHE = { 'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300' }

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(user, { headers: CACHE })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const w = console.warn; console.warn = () => {}
  const { data: { session } } = await supabase.auth.getSession()
  console.warn = w
  const email = session?.user?.email

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as { name?: string; phone?: string; nameEn?: string; passportNo?: string | null; passportExpiry?: string | null }

  const dbUser = await db.user.update({
    where: { email },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.nameEn != null && { nameEn: body.nameEn }),
      ...(body.passportNo !== undefined && { passportNo: body.passportNo }),
      ...(body.passportExpiry !== undefined && { passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null }),
      ...(body.phone != null && { phone: body.phone }),
    },
    select: { id: true, name: true, nameEn: true, email: true, phone: true, avatarUrl: true, passportNo: true, passportExpiry: true },
  })

  invalidateCache(`dbuser:${email}`)
  return NextResponse.json(dbUser)
}
