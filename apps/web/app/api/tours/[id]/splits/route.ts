import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'
import { getCached, setCache, invalidateCache } from '@/lib/cache'
import { getAuthUserLight } from '@/lib/auth'

// GET /api/tours/[id]/splits — list all splits for this tour
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const cacheKey = `splits:${id}`
  const cached = getCached(cacheKey)
  if (cached) return NextResponse.json(cached)

  const expenses = await db.expense.findMany({
    where: { tourId: id },
    select: {
      id: true, tourId: true, title: true, amount: true, currency: true,
      amountTHB: true, category: true, receiptUrl: true, notes: true, date: true, paidById: true,
      paidBy: { select: { id: true, name: true, avatarUrl: true } },
      participants: {
        select: {
          id: true, expenseId: true, userId: true, share: true, isPaid: true, settleReceiptUrl: true,
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { date: 'desc' },
    take: 200,
  })
  setCache(cacheKey, expenses, 15_000)
  return NextResponse.json(expenses)
}

// POST /api/tours/[id]/splits — create a new split
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const me = await getAuthUserLight()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    title: string
    amount: number
    category?: string
    memberIds: string[]
    receiptUrl?: string | null
    notes?: string | null
  }

  const share = body.memberIds.length > 0 ? Math.ceil(body.amount / body.memberIds.length) : 0

  const expense = await db.expense.create({
    data: {
      tourId: id,
      title: body.title || 'รายการหาร',
      amount: body.amount,
      currency: 'THB',
      paidById: me.id,
      category: (body.category as 'FOOD' | 'TRANSPORT' | 'ACCOMMODATION' | 'ACTIVITY' | 'SHOPPING' | 'TIPS' | 'EMERGENCY' | 'ENTRANCE_FEE' | 'OTHER') ?? 'OTHER',
      receiptUrl: body.receiptUrl ?? null,
      notes: body.notes ?? null,
      participants: {
        create: body.memberIds.map(userId => ({
          userId,
          share,
          isPaid: userId === me.id, // creator already paid
        })),
      },
    },
    include: {
      paidBy: { select: { id: true, name: true, avatarUrl: true } },
      participants: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  })

  logActivity({
    action: 'expense.add',
    entity: 'Expense',
    entityId: expense.id,
    description: `สร้างรายการหารค่าใช้จ่าย "${expense.title}"`,
    actorId: me.id,
    actorName: me.name,
    tourId: id,
  }).catch(() => {})

  invalidateCache(`splits:${id}`)
  return NextResponse.json(expense)
}
