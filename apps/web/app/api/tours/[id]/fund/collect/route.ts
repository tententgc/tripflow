import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db, logActivity } from '@tripflow/database'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  return db.user.findUnique({ where: { email: user.email } })
}

// POST /api/tours/[id]/fund/collect
// Creates DEPOSIT transactions for every tour member (isPaid: false)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { amountPerPerson: number; description: string }
    const { amountPerPerson, description } = body

    if (!amountPerPerson || amountPerPerson <= 0) {
      return NextResponse.json({ error: 'จำนวนเงินไม่ถูกต้อง' }, { status: 400 })
    }

    // Ensure fund exists
    const fund = await db.groupFund.upsert({
      where: { tourId: id },
      update: {},
      create: { tourId: id, name: 'กองกลาง', balance: 0 },
    })

    // Get all tour members
    const tourMembers = await db.tourMember.findMany({
      where: { tourId: id },
      include: { user: { select: { id: true, name: true } } },
    })

    // Create a DEPOSIT transaction for each member (isPaid: false = pending)
    await db.groupFundTransaction.createMany({
      data: tourMembers.map(tm => ({
        fundId: fund.id,
        type: 'DEPOSIT' as const,
        amount: amountPerPerson,
        description: description || 'เรียกเก็บเงินกองกลาง',
        userId: tm.userId,
        isPaid: false,
        createdById: me.id,
      })),
    })

    const updated = await db.groupFund.findUnique({
      where: { id: fund.id },
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

    logActivity({ action: 'fund.collect', entity: 'FundTransaction', description: 'เก็บเงินเข้ากองกลาง', tourId: id }).catch(() => {})

    return NextResponse.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST fund/collect] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
