import { db } from '@tripflow/database'
import { notFound } from 'next/navigation'
import ItineraryBuilder from './ItineraryBuilder'

export default async function ItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tour = await db.tour.findUnique({
    where: { id },
    include: {
      days: {
        include: {
          activities: { orderBy: { order: 'asc' } },
          accommodation: true,
        },
        orderBy: { dayNumber: 'asc' },
      },
    },
  })

  if (!tour) notFound()

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <a href={`/tours/${tour.id}`} className="text-gray-500 hover:text-gray-700 text-sm">← กลับ</a>
        <div>
          <h1 className="text-xl font-bold text-gray-900">กำหนดการ</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tour.title}</p>
        </div>
      </div>

      <ItineraryBuilder tour={tour} />
    </div>
  )
}
