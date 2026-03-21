import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const { dayId } = await params
    const body = await req.json() as {
      time?: string | null
      title: string
      titleLocal?: string | null
      description?: string | null
      category: string
      imageUrls?: string[]
    }

    const maxOrder = await db.activity.aggregate({
      where: { tourDayId: dayId },
      _max: { order: true },
    })

    const activity = await db.activity.create({
      data: {
        tourDayId: dayId,
        order: (maxOrder._max.order ?? -1) + 1,
        time: body.time ?? null,
        title: body.title,
        titleLocal: body.titleLocal ?? null,
        description: body.description ?? null,
        category: body.category as any,
        imageUrls: body.imageUrls ?? [],
      },
    })

    logActivity({ action: 'activity.add', entity: 'Activity', entityId: activity.id, description: `เพิ่มกิจกรรม "${activity.title}"` }).catch(() => {})

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Activity POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
