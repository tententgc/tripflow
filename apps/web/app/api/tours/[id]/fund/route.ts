import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'
import { invalidateCache } from '@/lib/cache'
import { getAuthUserLight } from '@/lib/auth'
import { unstable_cache, revalidateTag } from 'next/cache'

function getCachedFund(tourId: string) {
  return unstable_cache(
    async () => {
      return db.groupFund.findUnique({
        where: { tourId },
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
    },
    ['fund', tourId],
    { revalidate: 15, tags: [`fund-${tourId}`] }
  )()
}

// GET /api/tours/[id]/fund — get fund info with transactions
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const fund = await getCachedFund(id)
  return NextResponse.json(fund)
}

// POST /api/tours/[id]/fund — create fund (idempotent)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const me = await getAuthUserLight()
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

  logActivity({ action: 'fund.create', entity: 'GroupFund', description: 'สร้างกองกลาง', actorId: me.id, actorName: me.name, tourId: id }).catch(() => {})

  revalidateTag(`fund-${id}`, 'max')
  return NextResponse.json(fund)
}
