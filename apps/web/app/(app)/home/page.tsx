import { db } from '@tripflow/database'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import HomeClient from './HomeClient'
import { getAuthUser } from '@/lib/auth'
import { cachedFetch } from '@/lib/cache'

export const metadata: Metadata = { title: 'ทริปของฉัน — TripFlow' }

export default async function HomePage() {
  const dbUser = await getAuthUser()
  if (!dbUser) redirect('/login')

  const tours = await cachedFetch(`user-tours:${dbUser.id}`, async () => {
    const tourMembers = await db.tourMember.findMany({
      where: {
        userId: dbUser.id,
        tour: { status: { in: ['PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] } },
      },
      select: {
        tour: {
          select: {
            id: true, title: true, coverImageUrl: true, countries: true,
            primaryCountry: true, cities: true, startDate: true, endDate: true,
            isChina: true, status: true,
            _count: { select: { members: true } },
            days: { select: { id: true, mealBreakfast: true, mealLunch: true, mealDinner: true } },
          },
        },
      },
      orderBy: { tour: { startDate: 'asc' } },
      take: 50,
    })
    return tourMembers.map(tm => ({
      ...tm.tour,
      startDate: tm.tour.startDate.toISOString(),
      endDate: tm.tour.endDate.toISOString(),
    }))
  }, 60_000) // cache for 60s

  return (
    <HomeClient
      initialData={{
        tours,
        user: { id: dbUser.id, name: dbUser.name, avatarUrl: dbUser.avatarUrl },
      }}
    />
  )
}
