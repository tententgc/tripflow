import { db } from '@tripflow/database'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import TodayClient from './TodayClient'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const tour = await db.tour.findUnique({
    where: { id },
    select: { title: true },
  })
  return { title: tour ? `${tour.title} — วันนี้` : 'วันนี้ — TripFlow' }
}

/**
 * Fetch tour data for the today view.
 * Single Prisma query with nested selects — 1 DB round trip.
 * Cached by Next.js for 60s, tagged for on-demand revalidation.
 */
function getTourForToday(id: string) {
  return unstable_cache(
    async () => {
      const tour = await db.tour.findUnique({
        where: { id },
        select: {
          id: true, title: true, startDate: true, endDate: true,
          isChina: true, countries: true, primaryCountry: true,
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

      if (!tour) return null

      return {
        ...tour,
        startDate: tour.startDate.toISOString(),
        endDate: tour.endDate.toISOString(),
        days: tour.days.map(d => ({
          ...d,
          date: d.date.toISOString(),
        })),
        flights: tour.flights.map(f => ({
          ...f,
          departAt: f.departAt.toISOString(),
          arriveAt: f.arriveAt.toISOString(),
        })),
      }
    },
    ['tour-today', id],
    { revalidate: 60, tags: [`tour-${id}`] }
  )()
}

function getAnnouncements(tourId: string) {
  return unstable_cache(
    async () => {
      const anns = await db.tourAnnouncement.findMany({
        where: { tourId },
        select: {
          id: true, title: true, content: true,
          imageUrls: true, order: true, isPinned: true, createdAt: true,
        },
        orderBy: [{ isPinned: 'desc' }, { order: 'asc' }],
      })
      return anns.map(a => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))
    },
    ['announcements', tourId],
    { revalidate: 60, tags: [`tour-${tourId}`] }
  )()
}

export default async function TodayPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // All 3 run in parallel — auth doesn't block data fetch
  const [dbUser, tour, announcements] = await Promise.all([
    getAuthUser(),
    getTourForToday(id),
    getAnnouncements(id),
  ])

  if (!dbUser) redirect('/login')
  if (!tour) notFound()

  return (
    <TodayClient
      initialTour={tour}
      initialAnnouncements={announcements}
      tourId={id}
    />
  )
}
