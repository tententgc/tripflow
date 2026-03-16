import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'
import { getTourRegion } from '@tripflow/utils'

export async function GET(_req: NextRequest) {
  try {
    const tours = await db.tour.findMany({
      include: {
        operator: { select: { name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { startDate: 'asc' },
    })
    return NextResponse.json(tours)
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

    return NextResponse.json(tour, { status: 201 })
  } catch (error) {
    console.error('Tours POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
