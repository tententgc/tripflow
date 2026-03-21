import { db } from '@tripflow/database'
import { Metadata } from 'next'
import TravelersClient from './TravelersClient'
import { getCached, setCache } from '@/lib/cache'

export const metadata: Metadata = { title: 'นักเดินทาง — TripFlow Admin' }
export const revalidate = 300

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTravelersData(): Promise<{ users: any[]; tours: any[] }> {
  const cached = getCached<{ users: unknown[]; tours: unknown[] }>('admin:travelers')
  if (cached) return cached

  const [users, tours] = await Promise.all([
    db.user.findMany({
      select: {
        id: true, name: true, nameEn: true, email: true, phone: true,
        avatarUrl: true, passportNo: true, passportExpiry: true, createdAt: true,
        tourMembers: {
          select: {
            id: true, role: true, joinedAt: true,
            tour: {
              select: { id: true, title: true, startDate: true, endDate: true, primaryCountry: true, isChina: true, status: true },
            },
          },
          orderBy: { joinedAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    db.tour.findMany({
      where: { status: { in: ['DRAFT', 'PUBLISHED', 'ACTIVE'] } },
      select: { id: true, title: true, startDate: true, primaryCountry: true, isChina: true, status: true },
      orderBy: { startDate: 'asc' },
    }),
  ])
  const data = { users, tours }
  setCache('admin:travelers', data, 60_000)
  return data
}

export default async function TravelersPage() {
  const { users, tours } = await getTravelersData()

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">นักเดินทาง</h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} คนในระบบ</p>
      </div>
      <TravelersClient initialUsers={users} allTours={tours} />
    </div>
  )
}
