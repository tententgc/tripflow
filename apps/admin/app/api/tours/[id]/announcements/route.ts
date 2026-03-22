import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const announcements = await db.tourAnnouncement.findMany({
      where: { tourId: id },
      orderBy: [{ isPinned: 'desc' }, { order: 'asc' }],
    })
    const res = NextResponse.json(announcements)
    res.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30')
    return res
  } catch (error) {
    console.error('Announcements GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json() as {
      title: string
      content: string
      imageUrls?: string[]
      isPinned?: boolean
    }

    const count = await db.tourAnnouncement.count({ where: { tourId: id } })

    const announcement = await db.tourAnnouncement.create({
      data: {
        tourId: id,
        title: body.title,
        content: body.content,
        imageUrls: body.imageUrls ?? [],
        isPinned: body.isPinned ?? false,
        order: count,
      },
    })

    logActivity({
      actorName: 'Admin',
      action: 'announcement.add',
      entity: 'TourAnnouncement',
      entityId: announcement.id,
      description: `สร้างประกาศ "${announcement.title}"`,
      tourId: id,
    }).catch(() => {})

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Announcement POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
