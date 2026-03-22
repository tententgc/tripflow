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
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-2">
          <Link href={`/tours/${tour.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-100 rounded-xl transition-colors font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            กลับ
          </Link>
          <span className="text-sm text-gray-400 truncate">{tour.title}</span>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">กำหนดการ</h1>
      </div>

      <ItineraryBuilder tour={tour} />
    </div>
  )
}
