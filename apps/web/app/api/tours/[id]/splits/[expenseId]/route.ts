import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'
import { invalidateCache } from '@/lib/cache'
import { getAuthUserLight } from '@/lib/auth'

// PATCH — settle (mark all participants as paid) or settle for one user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const [{ id, expenseId }, me, body] = await Promise.all([
      params,
      getAuthUserLight(),
      req.json() as Promise<{ settleAll?: boolean; settleReceiptUrl?: string }>,
    ])
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { settleAll, settleReceiptUrl } = body

    if (settleAll) {
      await db.expenseParticipant.updateMany({
        where: { expenseId },
        data: { isPaid: true },
      })
    } else {
      await db.expenseParticipant.updateMany({
        where: { expenseId, userId: me.id },
        data: {
          isPaid: true,
          settleReceiptUrl: settleReceiptUrl ?? null,
        },
      })
    }

    logActivity({ action: 'expense.settle', entity: 'Expense', entityId: expenseId, tourId: id, actorName: me.name, description: 'ชำระค่าใช้จ่าย' }).catch(() => {})

    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      select: {
        id: true, title: true, amount: true, category: true, date: true, receiptUrl: true, notes: true, paidById: true,
        paidBy: { select: { id: true, name: true, avatarUrl: true } },
        participants: {
          select: { id: true, userId: true, share: true, isPaid: true, settleReceiptUrl: true, user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    })

    invalidateCache(`splits:${id}`)
    return NextResponse.json(expense)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PATCH splits] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE — delete expense (only creator can delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const [{ id, expenseId }, me] = await Promise.all([params, getAuthUserLight()])
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const expense = await db.expense.findUnique({ where: { id: expenseId }, select: { paidById: true } })
  if (!expense || expense.paidById !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.expenseParticipant.deleteMany({ where: { expenseId } })
  await db.expense.delete({ where: { id: expenseId } })

  logActivity({ action: 'expense.delete', entity: 'Expense', entityId: expenseId, tourId: id, actorName: me.name, description: 'ลบรายการค่าใช้จ่าย' }).catch(() => {})

  invalidateCache(`splits:${id}`)
  return NextResponse.json({ ok: true })
}
