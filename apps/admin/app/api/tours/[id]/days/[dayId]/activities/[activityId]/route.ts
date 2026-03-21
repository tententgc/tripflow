import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string; activityId: string }> }
) {
  try {
    const { activityId } = await params
    const body = await req.json() as {
      time?: string | null
      title?: string
      titleLocal?: string | null
      description?: string | null
      category?: string
      imageUrls?: string[]
    }

    const activity = await db.activity.update({
      where: { id: activityId },
      data: {
        ...(body.time !== undefined && { time: body.time }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.titleLocal !== undefined && { titleLocal: body.titleLocal }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category as any }),
        ...(body.imageUrls !== undefined && { imageUrls: body.imageUrls }),
      },
    })

    logActivity({ actorName: 'Admin', action: 'activity.update', entity: 'Activity', entityId: activityId, description: 'แก้ไขกิจกรรม' }).catch(() => {})

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Activity PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string; activityId: string }> }
) {
  try {
    const { activityId } = await params
    await db.activity.delete({ where: { id: activityId } })

    logActivity({ actorName: 'Admin', action: 'activity.delete', entity: 'Activity', entityId: activityId, description: 'ลบกิจกรรม' }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Activity DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
