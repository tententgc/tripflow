import { NextResponse } from 'next/server'
import { db } from '@tripflow/database'
import { getAuthUser } from '@/lib/auth'
import { cachedFetch } from '@/lib/cache'

const CACHE = { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' }

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tours = await cachedFetch(`user-tours:${user.id}`, async () => {
    const tourMembers = await db.tourMember.findMany({
      where: {
        userId: user.id,
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
    return tourMembers.map(tm => tm.tour)
  }, 15_000)

  return NextResponse.json(
    { tours, user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl } },
    { headers: CACHE },
  )
}
