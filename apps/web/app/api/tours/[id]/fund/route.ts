import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@tripflow/database'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  return db.user.findUnique({ where: { email: user.email } })
}

// GET /api/tours/[id]/fund — get fund info with transactions
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const fund = await db.groupFund.findUnique({
    where: { tourId: id },
    include: {
      transactions: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return NextResponse.json(fund)
}

// POST /api/tours/[id]/fund — create fund (idempotent)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { name?: string }

  const fund = await db.groupFund.upsert({
    where: { tourId: id },
    update: {},
    create: {
      tourId: id,
      name: body.name ?? 'กองกลาง',
      balance: 0,
    },
    include: {
      transactions: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return NextResponse.json(fund)
}
