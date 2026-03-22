import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'
import { cachedFetch } from '@/lib/cache'

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' }

async function fetchBasicTour(id: string) {
  return db.tour.findUnique({
    where: { id },
    select: {
      id: true, title: true, titleEn: true, isChina: true, status: true,
      primaryCountry: true, countries: true, cities: true,
      startDate: true, endDate: true, timezone: true,
      currency: true, destCurrency: true, coverImageUrl: true,
      days: {
        select: {
          id: true, dayNumber: true, date: true, title: true,
          city: true, country: true, isChina: true,
          mealBreakfast: true, mealLunch: true, mealDinner: true,
          accommodation: { select: { name: true, imageUrl: true, checkIn: true, checkOut: true } },
        },
        orderBy: { dayNumber: 'asc' },
      },
      members: {
        select: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      _count: { select: { members: true } },
    },
  })
}

async function fetchFullTour(id: string) {
  const tourCore = await db.tour.findUnique({
    where: { id },
    select: {
      id: true, title: true, titleEn: true, description: true,
      isChina: true, status: true, primaryCountry: true, countries: true,
      cities: true, startDate: true, endDate: true, timezone: true,
      currency: true, destCurrency: true, coverImageUrl: true,
      tourCode: true, maxMembers: true,
    },
  })

  if (!tourCore) return null

  const [days, flights, contacts, checklists, emergencyInfo, documents, usefulPhrases, members] = await Promise.all([
    db.tourDay.findMany({
      where: { tourId: id },
      include: {
        activities: { orderBy: { order: 'asc' } },
        transports: { orderBy: { order: 'asc' } },
        accommodation: true,
        dayItems: { select: { id: true, tourDayId: true, label: true, labelEn: true, order: true } },
      },
      orderBy: { dayNumber: 'asc' },
    }),
    db.flightInfo.findMany({ where: { tourId: id }, orderBy: { departAt: 'asc' } }),
    db.importantContact.findMany({ where: { tourId: id } }),
    db.checklist.findMany({
      where: { tourId: id },
      include: { items: { orderBy: { order: 'asc' } } },
    }),
    db.emergencyInfo.findFirst({ where: { tourId: id } }),
    db.tourDocument.findMany({
      where: { tourId: id },
      select: { id: true, title: true, titleEn: true, type: true, fileUrl: true, qrData: true, description: true, isPersonal: true, userId: true },
    }),
    db.usefulPhrase.findMany({
      where: { tourId: id },
      select: { id: true, tourId: true, category: true, thai: true, english: true, local: true, localPinyin: true, audioUrl: true, order: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    }),
    db.tourMember.findMany({
      where: { tourId: id },
      select: {
        id: true, tourId: true, userId: true, role: true, seatNo: true, roomNo: true, bedType: true, notes: true, joinedAt: true,
        user: { select: { id: true, name: true, phone: true, avatarUrl: true, fcmToken: true, jpushId: true } },
      },
    }),
  ])

  return { ...tourCore, days, flights, contacts, checklists, emergencyInfo, documents, usefulPhrases, members }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const fields = req.nextUrl.searchParams.get('fields')

    if (fields === 'basic') {
      // Thundering herd protected — 1000 users requesting same tour = 1 DB query
      const tour = await cachedFetch(`tour:${id}:basic`, () => fetchBasicTour(id), 15_000)

      if (!tour || tour.status === 'DRAFT' || tour.status === 'CANCELLED') {
        return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
      }
      return NextResponse.json(tour, { headers: CACHE_HEADERS })
    }

    // Full mode — thundering herd protected
    const tour = await cachedFetch(`tour:${id}:full`, () => fetchFullTour(id), 15_000)

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
    }
    if (tour.status === 'DRAFT' || tour.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Tour not available' }, { status: 403 })
    }

    return NextResponse.json(tour, { headers: CACHE_HEADERS })
  } catch (error) {
    console.error('Tour GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
