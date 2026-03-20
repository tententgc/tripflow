import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

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
      category?: string
      imageUrls?: string[]
    }

    const activity = await db.activity.update({
      where: { id: activityId },
      data: {
        ...(body.time !== undefined && { time: body.time }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.titleLocal !== undefined && { titleLocal: body.titleLocal }),
        ...(body.category !== undefined && { category: body.category as any }),
        ...(body.imageUrls !== undefined && { imageUrls: body.imageUrls }),
      },
    })

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
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Activity DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
