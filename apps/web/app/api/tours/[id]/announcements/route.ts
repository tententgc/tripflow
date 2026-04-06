import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'
import { unstable_cache } from 'next/cache'

function getCachedAnnouncements(tourId: string) {
  return unstable_cache(
    async () => {
      return db.tourAnnouncement.findMany({
        where: { tourId },
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
    },
    ['announcements', tourId],
    { revalidate: 60, tags: [`tour-${tourId}`] }
  )()
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const announcements = await getCachedAnnouncements(id)

    const res = NextResponse.json(announcements)
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    return res
  } catch (error) {
    console.error('Announcements GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
