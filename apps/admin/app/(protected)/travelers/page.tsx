import { db } from '@tripflow/database'
import { Metadata } from 'next'
import TravelersClient from './TravelersClient'

export const metadata: Metadata = { title: 'นักเดินทาง — TripFlow Admin' }

export default async function TravelersPage() {
  const [users, tours] = await Promise.all([
    db.user.findMany({
      include: {
        tourMembers: {
          include: {
            tour: {
              select: { id: true, title: true, startDate: true, endDate: true, primaryCountry: true, isChina: true, status: true },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.tour.findMany({
      where: { status: { in: ['DRAFT', 'PUBLISHED', 'ACTIVE'] } },
      select: { id: true, title: true, startDate: true, primaryCountry: true, isChina: true, status: true },
      orderBy: { startDate: 'asc' },
    }),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">นักเดินทาง</h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} คนในระบบ</p>
      </div>
      <TravelersClient initialUsers={users} allTours={tours} />
    </div>
  )
}
