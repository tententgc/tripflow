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
      req.json() as Promise<{ amount: number; description: string }>,
    ])
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, description } = body
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'จำนวนเงินไม่ถูกต้อง' }, { status: 400 })
    }

    const fund = await db.groupFund.findUnique({
      where: { tourId: id },
      select: { id: true, balance: true },
    })
    if (!fund) return NextResponse.json({ error: 'ยังไม่มีกองกลาง' }, { status: 404 })
    if (fund.balance < amount) {
      return NextResponse.json({ error: 'ยอดกองกลางไม่เพียงพอ' }, { status: 400 })
    }

    // Single transaction: create withdrawal + update balance
    const [tx, updated] = await db.$transaction([
      db.groupFundTransaction.create({
        data: {
          fundId: fund.id,
          type: 'WITHDRAWAL',
          amount,
          description: description || 'ถอนจากกองกลาง',
          userId: null,
          isPaid: true,
          createdById: me.id,
        },
      }),
      db.groupFund.update({
        where: { id: fund.id },
        data: { balance: { decrement: amount } },
        select: { id: true, name: true, balance: true },
      }),
    ])

    // Fire-and-forget: don't block response
    logActivity({ action: 'fund.withdraw', entity: 'FundTransaction', description: 'ถอนเงินจากกองกลาง', actorId: me.id, actorName: me.name, tourId: id }).catch(() => {})

    invalidateCache(`fund:${id}`)
    // Return minimal data — frontend will refetch the full fund data
    return NextResponse.json({ transaction: tx, fund: updated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST fund/withdraw] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
