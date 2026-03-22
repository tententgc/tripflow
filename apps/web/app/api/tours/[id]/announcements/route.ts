import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const announcements = await db.tourAnnouncement.findMany({
      where: { tourId: id },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrls: true,
        order: true,
        isPinned: true,
        createdAt: true,
      },
      orderBy: [{ isPinned: 'desc' }, { order: 'asc' }],
    })

    const res = NextResponse.json(announcements)
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    return res
  } catch (error) {
    console.error('Announcements GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
