import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'
import { getTourRegion } from '@tripflow/utils'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50))

    const tours = await db.tour.findMany({
      include: {
        operator: { select: { name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { startDate: 'asc' },
      take: limit,
      skip: (page - 1) * limit,
    })
    const res = NextResponse.json(tours)
    res.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30')
    return res
  } catch (error) {
    console.error('Tours GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      operatorId: string
      title: string
      titleEn?: string
      countries: string[]
      cities: string[]
      startDate: string
      endDate: string
      timezone: string
      maxMembers?: number
      tourCode?: string
    }

    const region = getTourRegion(body.countries)
    const isChina = region === 'CHINA'
    const primaryCountry = body.countries[0] ?? 'TH'

    const tour = await db.tour.create({
      data: {
        operatorId: body.operatorId,
        title: body.title,
        titleEn: body.titleEn ?? null,
        countries: body.countries,
        primaryCountry,
        cities: body.cities,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        timezone: body.timezone,
        isChina,
        maxMembers: body.maxMembers ?? null,
        tourCode: body.tourCode ?? null,
        status: 'DRAFT',
      },
    })

    logActivity({
      action: 'tour.create',
      entity: 'Tour',
      entityId: tour.id,
      description: `สร้างทัวร์ "${tour.title}"`,
      tourId: tour.id,
    }).catch(() => {})

    return NextResponse.json(tour, { status: 201 })
  } catch (error) {
    console.error('Tours POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
