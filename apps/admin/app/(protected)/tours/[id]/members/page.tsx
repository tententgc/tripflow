import { db } from '@tripflow/database'
import { notFound } from 'next/navigation'
import MembersClient from './MembersClient'

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tour = await db.tour.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              passportExpiry: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if (!tour) notFound()

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <a href={`/tours/${tour.id}`} className="text-gray-500 hover:text-gray-700 text-sm">← {tour.title}</a>
        <h1 className="text-xl font-bold text-gray-900">สมาชิก ({tour.members.length} คน)</h1>
      </div>

      <MembersClient tourId={tour.id} initialMembers={tour.members} />
    </div>
  )
}
