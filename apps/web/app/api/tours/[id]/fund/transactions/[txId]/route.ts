import { invalidateCache } from '@/lib/cache'
import { getAuthUserLight } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'


// PATCH /api/tours/[id]/fund/transactions/[txId]
// Marks transaction isPaid: true, adds receiptUrl, increments fund.balance
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  try {
    const { id: tourId, txId } = await params
    const me = await getAuthUserLight()
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

    invalidateCache(`fund:${tourId}`)
    return NextResponse.json(updatedTx)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PATCH fund/transactions] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/tours/[id]/fund/transactions/[txId]
// Cancels/deletes an unpaid deposit request. If already paid, decrements fund balance.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  try {
    const { id: tourId, txId } = await params
    const me = await getAuthUserLight()
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tx = await db.groupFundTransaction.findUnique({ where: { id: txId } })
    if (!tx) return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 })

    if (tx.isPaid && tx.type === 'DEPOSIT') {
      await db.$transaction([
        db.groupFundTransaction.delete({ where: { id: txId } }),
        db.groupFund.update({
          where: { id: tx.fundId },
          data: { balance: { decrement: tx.amount } },
        }),
      ])
    } else {
      await db.groupFundTransaction.delete({ where: { id: txId } })
    }

    invalidateCache(`fund:${tourId}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[DELETE fund/transactions] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
