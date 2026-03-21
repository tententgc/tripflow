import { db } from '@tripflow/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/tours/${tour.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          กลับ
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">กำหนดการ</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tour.title}</p>
        </div>
      </div>

      <ItineraryBuilder tour={tour} />
    </div>
  )
}
