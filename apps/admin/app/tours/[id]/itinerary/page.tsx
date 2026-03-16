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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-white border-r border-gray-200 fixed left-0 top-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">TripFlow</p>
                <p className="text-xs text-gray-500">Admin Portal</p>
              </div>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            {[
              { href: '/dashboard', label: 'แดชบอร์ด', icon: '📊' },
              { href: '/tours', label: 'จัดการทัวร์', icon: '🗺️', active: true },
              { href: '/travelers', label: 'นักเดินทาง', icon: '👥' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${'active' in item ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="ml-64 flex-1 p-8">
          <div className="mb-6 flex items-center gap-4">
            <a href={`/tours/${tour.id}`} className="text-gray-500 hover:text-gray-700 text-sm">← กลับ</a>
            <div>
              <h1 className="text-xl font-bold text-gray-900">กำหนดการ</h1>
              <p className="text-gray-500 text-sm mt-0.5">{tour.title}</p>
            </div>
          </div>

          <ItineraryBuilder tour={tour} />
        </main>
      </div>
    </div>
  )
}
