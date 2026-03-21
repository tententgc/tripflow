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

    const cached = getCached('emergency:' + id)
    if (cached) return NextResponse.json(cached, { headers: HEADERS })

    const [emergency, tour] = await Promise.all([
      db.emergencyInfo.findUnique({
        where: { tourId: id },
      }),
      db.tour.findUnique({
        where: { id },
        select: { isChina: true, countries: true },
      }),
    ])

    const data = { emergency, isChina: tour?.isChina ?? false }
    setCache('emergency:' + id, data, 300_000)

    return NextResponse.json(data, { headers: HEADERS })
  } catch (error) {
    console.error('Emergency GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
