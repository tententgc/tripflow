import { invalidateCache } from '@/lib/cache'
import { getAuthUserLight } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parallel: params + auth + body
    const [{ id }, me, body] = await Promise.all([
      params,
      getAuthUserLight(),
      req.json() as Promise<{ amountPerPerson: number; description: string }>,
    ])
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amountPerPerson, description } = body
    if (!amountPerPerson || amountPerPerson <= 0) {
      return NextResponse.json({ error: 'จำนวนเงินไม่ถูกต้อง' }, { status: 400 })
    }

    // Parallel: ensure fund + get members
    const [fund, tourMembers] = await Promise.all([
      db.groupFund.upsert({
        where: { tourId: id },
        update: {},
        create: { tourId: id, name: 'กองกลาง', balance: 0 },
        select: { id: true },
      }),
      db.tourMember.findMany({
        where: { tourId: id },
        select: { userId: true },
      }),
    ])

    // Batch create deposit transactions
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

    // Return minimal — frontend refetches via GET /fund
    const updated = await db.groupFund.findUnique({
      where: { id: fund.id },
      select: {
        id: true, name: true, balance: true,
        transactions: {
          select: {
            id: true, type: true, amount: true, description: true,
            userId: true, receiptUrl: true, isPaid: true, createdAt: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
            createdBy: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    logActivity({ action: 'fund.collect', entity: 'FundTransaction', description: 'เก็บเงินเข้ากองกลาง', actorId: me.id, actorName: me.name, tourId: id }).catch(() => {})

    invalidateCache(`fund:${id}`)
    return NextResponse.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST fund/collect] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
