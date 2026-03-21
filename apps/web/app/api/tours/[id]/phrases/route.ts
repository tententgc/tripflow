import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'
import { getCached, setCache } from '@/lib/cache'

const HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const cached = getCached('phrases:' + id)
    if (cached) return NextResponse.json(cached, { headers: HEADERS })

    const phrases = await db.usefulPhrase.findMany({
      where: { tourId: id },
      select: {
        id: true,
        tourId: true,
        category: true,
        thai: true,
        english: true,
        local: true,
        localPinyin: true,
        audioUrl: true,
        order: true,
      },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    })

    setCache('phrases:' + id, phrases, 300_000)

    return NextResponse.json(phrases, { headers: HEADERS })
  } catch (error) {
    console.error('Phrases GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
