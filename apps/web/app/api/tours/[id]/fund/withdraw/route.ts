import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db, logActivity } from '@tripflow/database'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  return db.user.findUnique({ where: { email: user.email } })
}

// POST /api/tours/[id]/fund/withdraw
// Creates a WITHDRAWAL transaction (isPaid: true), decrements fund.balance
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { amount: number; description: string }
    const { amount, description } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'จำนวนเงินไม่ถูกต้อง' }, { status: 400 })
    }

    const fund = await db.groupFund.findUnique({ where: { tourId: id } })
    if (!fund) return NextResponse.json({ error: 'ยังไม่มีกองกลาง' }, { status: 404 })
    if (fund.balance < amount) {
      return NextResponse.json({ error: 'ยอดกองกลางไม่เพียงพอ' }, { status: 400 })
    }

    const [tx] = await db.$transaction([
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
      }),
    ])

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

    logActivity({ action: 'fund.withdraw', entity: 'FundTransaction', description: 'ถอนเงินจากกองกลาง', tourId: id }).catch(() => {})

    return NextResponse.json({ transaction: tx, fund: updated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST fund/withdraw] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
