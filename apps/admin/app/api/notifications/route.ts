import { NextRequest, NextResponse } from 'next/server'
import { createPushAdapter } from '@tripflow/adapters'
import { db } from '@tripflow/database'
import { getTourRegion } from '@tripflow/utils'

export async function POST(req: NextRequest) {
  try {
    const { tourId, title, body, data } = await req.json() as {
      tourId: string
      title: string
      body: string
      data?: Record<string, string>
    }

    const tour = await db.tour.findUnique({
      where: { id: tourId },
      include: { members: { include: { user: true } } },
    })

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
    }

    const region = getTourRegion(tour.countries)
    const pushAdapter = createPushAdapter(region)

    const userIds = tour.members.map((m) => m.userId)
    await pushAdapter.sendToMultiple(userIds, title, body, region, data)

    // Store notification in DB
    await db.notification.createMany({
      data: userIds.map((userId) => ({
        tourId,
        userId,
        title,
        body,
        type: 'GENERAL' as const,
        data: data ?? {},
        sentAt: new Date(),
      })),
    })

    return NextResponse.json({ success: true, sent: userIds.length })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}
