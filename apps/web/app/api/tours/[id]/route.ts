import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'
import { unstable_cache } from 'next/cache'

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' }

/**
 * Basic tour — used by home page tour cards.
 * Single query with nested selects.
 */
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

/**
 * Today view — used by the today page.
 * Only fetches what the today page actually renders:
 * tour core, days (with activities/transports/accommodation), flights, contacts, members.
 * Skips: checklists, documents, usefulPhrases, emergencyInfo.
 */
async function fetchTodayView(id: string) {
  // Single query with nested relations — 1 round trip instead of 5
  const tour = await db.tour.findUnique({
    where: { id },
    select: {
      id: true, title: true, titleEn: true,
      isChina: true, status: true, primaryCountry: true, countries: true,
      cities: true, startDate: true, endDate: true, timezone: true,
      currency: true, destCurrency: true, coverImageUrl: true,
      days: {
        select: {
          id: true, dayNumber: true, date: true, title: true,
          city: true, country: true, summary: true,
          weatherLat: true, weatherLon: true,
          mealBreakfast: true, mealLunch: true, mealDinner: true,
          activities: {
            select: {
              id: true, time: true, title: true, titleEn: true, titleLocal: true,
              description: true, category: true, locationName: true,
              address: true, addressLocal: true, googleMapUrl: true,
              durationMins: true, cost: true, costCurrency: true, costTHB: true,
              tips: true, imageUrls: true,
            },
            orderBy: { order: 'asc' },
          },
          transports: {
            select: {
              id: true, type: true, from: true, fromLocal: true,
              to: true, toLocal: true, departTime: true, arriveTime: true,
              duration: true, lineName: true, lineNameLocal: true, notes: true,
            },
            orderBy: { order: 'asc' },
          },
          accommodation: {
            select: {
              name: true, nameLocal: true, phone: true,
              checkIn: true, checkOut: true,
              wifiName: true, wifiPassword: true, imageUrl: true,
            },
          },
        },
        orderBy: { dayNumber: 'asc' },
      },
      flights: {
        select: {
          id: true, flightNo: true, airline: true, airlineIata: true,
          fromAirport: true, fromIata: true, toAirport: true, toIata: true,
          departAt: true, arriveAt: true, departTz: true, arriveTz: true,
          terminal: true, gate: true,
        },
        orderBy: { departAt: 'asc' },
      },
      contacts: {
        select: {
          id: true, name: true, nameLocal: true, phone: true,
          wechat: true, line: true, whatsapp: true, type: true, notes: true,
        },
      },
      members: {
        select: { user: { select: { name: true } } },
      },
    },
  })

  return tour
}

function getCachedBasicTour(id: string) {
  return unstable_cache(
    () => fetchBasicTour(id),
    ['tour', 'basic', id],
    { revalidate: 60, tags: [`tour-${id}`] }
  )()
}

function getCachedTodayView(id: string) {
  return unstable_cache(
    () => fetchTodayView(id),
    ['tour', 'today', id],
    { revalidate: 60, tags: [`tour-${id}`] }
  )()
}

/**
 * Full tour — used by pages that need everything (itinerary builder, etc).
 * All queries run in parallel.
 */
async function fetchFullTour(id: string) {
  const [tourCore, days, flights, contacts, checklists, emergencyInfo, documents, usefulPhrases, members] = await Promise.all([
    db.tour.findUnique({
      where: { id },
      select: {
        id: true, title: true, titleEn: true, description: true,
        isChina: true, status: true, primaryCountry: true, countries: true,
        cities: true, startDate: true, endDate: true, timezone: true,
        currency: true, destCurrency: true, coverImageUrl: true,
        tourCode: true, maxMembers: true,
      },
    }),
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

  if (!tourCore) return null

  return { ...tourCore, days, flights, contacts, checklists, emergencyInfo, documents, usefulPhrases, members }
}

function getCachedFullTour(id: string) {
  return unstable_cache(
    () => fetchFullTour(id),
    ['tour', 'full', id],
    { revalidate: 60, tags: [`tour-${id}`] }
  )()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const fields = req.nextUrl.searchParams.get('fields')

    if (fields === 'basic') {
      const tour = await getCachedBasicTour(id)
      if (!tour || tour.status === 'DRAFT' || tour.status === 'CANCELLED') {
        return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
      }
      return NextResponse.json(tour, { headers: CACHE_HEADERS })
    }

    if (fields === 'today') {
      const tour = await getCachedTodayView(id)
      if (!tour || tour.status === 'DRAFT' || tour.status === 'CANCELLED') {
        return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
      }
      return NextResponse.json(tour, { headers: CACHE_HEADERS })
    }

    // Full mode
    const tour = await getCachedFullTour(id)
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
