import { db } from '@tripflow/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/tours/${tour.id}`} className="text-gray-500 hover:text-gray-700 text-sm">← {tour.title}</Link>
        <h1 className="text-xl font-bold text-gray-900">สมาชิก ({tour.members.length} คน)</h1>
      </div>

      <MembersClient tourId={tour.id} initialMembers={tour.members} />
    </div>
  )
}
