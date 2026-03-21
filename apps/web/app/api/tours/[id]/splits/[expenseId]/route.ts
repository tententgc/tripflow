import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db, logActivity } from '@tripflow/database'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  return db.user.findUnique({ where: { email: user.email } })
}

// PATCH — settle (mark all participants as paid) or settle for one user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const { expenseId } = await params
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { settleAll?: boolean; settleReceiptUrl?: string }
    const { settleAll, settleReceiptUrl } = body

    console.log('[PATCH splits] expenseId:', expenseId, 'userId:', me.id, 'settleAll:', settleAll, 'hasReceipt:', !!settleReceiptUrl)

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

    logActivity({ action: 'expense.settle', entity: 'Expense', entityId: expenseId, description: 'ชำระค่าใช้จ่าย' }).catch(() => {})

    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      include: {
        paidBy: { select: { id: true, name: true, avatarUrl: true } },
        participants: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    })
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
  const { expenseId } = await params
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const expense = await db.expense.findUnique({ where: { id: expenseId } })
  if (!expense || expense.paidById !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.expenseParticipant.deleteMany({ where: { expenseId } })
  await db.expense.delete({ where: { id: expenseId } })

  logActivity({ action: 'expense.delete', entity: 'Expense', entityId: expenseId, description: 'ลบรายการค่าใช้จ่าย' }).catch(() => {})

  return NextResponse.json({ ok: true })
}
