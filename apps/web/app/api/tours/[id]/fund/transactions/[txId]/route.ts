import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@tripflow/database'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  return db.user.findUnique({ where: { email: user.email } })
}

// PATCH /api/tours/[id]/fund/transactions/[txId]
// Marks transaction isPaid: true, adds receiptUrl, increments fund.balance
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  try {
    const { txId } = await params
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { receiptUrl?: string }

    const tx = await db.groupFundTransaction.findUnique({ where: { id: txId } })
    if (!tx) return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 })
    if (tx.isPaid) return NextResponse.json({ error: 'รายการนี้ชำระแล้ว' }, { status: 400 })

    // Update transaction and increment fund balance in a transaction
    const [updatedTx] = await db.$transaction([
      db.groupFundTransaction.update({
        where: { id: txId },
        data: {
          isPaid: true,
          receiptUrl: body.receiptUrl ?? null,
        },
      }),
      db.groupFund.update({
        where: { id: tx.fundId },
        data: { balance: { increment: tx.amount } },
      }),
    ])

    return NextResponse.json(updatedTx)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PATCH fund/transactions] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
