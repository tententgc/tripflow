import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'
import { revalidateWebCache } from '@/lib/revalidate-web'

// POST /api/tours/[id]/days/[dayId]/reorder
// Body: { activityIds: string[] } — ordered list of activity IDs
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const { id, dayId } = await params
    const { activityIds } = await req.json() as { activityIds: string[] }

    // Update order for each activity
    await Promise.all(
      activityIds.map((actId, index) =>
        db.activity.update({
          where: { id: actId },
          data: { order: index },
        })
      )
    )

    revalidateWebCache(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Reorder error:', error)
    return NextResponse.json({ error: 'Reorder failed' }, { status: 500 })
  }
}
