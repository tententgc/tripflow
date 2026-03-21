import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'
import { getCached, setCache, invalidateCache } from '@/lib/cache'
import { getAuthUserLight } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const cached = getCached('checklist:' + id)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' },
      })
    }

    const checklists = await db.checklist.findMany({
      where: { tourId: id },
      select: {
        id: true, tourId: true, title: true, titleEn: true, emoji: true, type: true, order: true,
        items: {
          select: {
            id: true, checklistId: true, label: true, labelEn: true, order: true, isImportant: true,
            checks: { select: { id: true, itemId: true, userId: true, checkedAt: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    setCache('checklist:' + id, checklists, 15_000)

    return NextResponse.json(checklists, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('Checklist GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const { itemId, userId, checked } = await req.json() as {
      itemId: string
      userId: string
      checked: boolean
    }

    if (checked) {
      await db.checklistCheck.upsert({
        where: { itemId_userId: { itemId, userId } },
        create: { itemId, userId },
        update: { checkedAt: new Date() },
      })
    } else {
      await db.checklistCheck.deleteMany({
        where: { itemId, userId },
      })
    }

    invalidateCache('checklist:' + id)

    const actor = await getAuthUserLight()
    logActivity({ action: 'checklist.check', entity: 'ChecklistCheck', description: checked ? 'ติ๊กเช็คลิสต์' : 'ยกเลิกติ๊กเช็คลิสต์', actorId: userId, ...(actor?.name ? { actorName: actor.name } : {}), tourId: id }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Checklist POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
