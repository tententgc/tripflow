import { db } from '@tripflow/database'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import TourDetailClient from './TourDetailClient'
import CoverImageEditor from './CoverImageEditor'
import FlightsManager from './FlightsManager'
import ContactsManager from './ContactsManager'
import TourInfoEditor from './TourInfoEditor'
import ChecklistsManager from './ChecklistsManager'
import DocumentsManager from './DocumentsManager'
import TourTabs from './TourTabs'

export const metadata: Metadata = { title: 'จัดการทัวร์ — TripFlow Admin' }

export default async function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
      members: { include: { user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } } } },
      flights: { orderBy: { departAt: 'asc' } },
      contacts: true,
      checklists: { include: { items: { orderBy: { order: 'asc' } } } },
      documents: true,
      _count: { select: { members: true } },
    },
  })

  if (!tour) notFound()

  /* ── Overview tab content ─────────────────────────────── */
  const overviewContent = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Days summary */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">กำหนดการ ({tour.days.length} วัน)</h2>
          <a href={`/tours/${tour.id}/itinerary`} className="text-blue-600 text-sm hover:underline">
            แก้ไขกำหนดการ →
          </a>
        </div>

        {tour.days.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-gray-600 font-medium">ยังไม่มีกำหนดการ</p>
            <p className="text-gray-400 text-sm mt-1">เพิ่มวันเดินทางเพื่อเริ่มสร้างกำหนดการ</p>
            <a href={`/tours/${tour.id}/itinerary`} className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
              + เพิ่มกำหนดการ
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tour.days.map((day) => (
              <div key={day.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">วันที่ {day.dayNumber} — {day.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(day.date).toLocaleDateString('th-TH')}
                      {day.city && ` · ${day.city}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {day.mealBreakfast && <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">🍳</span>}
                    {day.mealLunch && <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">🍱</span>}
                    {day.mealDinner && <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">🍽️</span>}
                  </div>
                  <p className="text-xs text-gray-400">{day.activities.length} กิจกรรม</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="space-y-4">
        {/* Members */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">สมาชิก ({tour._count.members})</h3>
            <a href={`/tours/${tour.id}/members`} className="text-blue-600 text-xs hover:underline">จัดการ →</a>
          </div>
          {tour.members.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-2">ยังไม่มีสมาชิก</p>
          ) : (
            <div className="space-y-2">
              {tour.members.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 overflow-hidden">
                    {m.user.avatarUrl ? (
                      <img src={m.user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : m.user.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{m.user.name}</p>
                    <p className="text-xs text-gray-400">{m.user.email}</p>
                  </div>
                </div>
              ))}
              {tour.members.length > 5 && (
                <p className="text-xs text-gray-400 text-center">+{tour.members.length - 5} คน</p>
              )}
            </div>
          )}
        </div>

        {/* Cover Image */}
        <CoverImageEditor tourId={tour.id} currentUrl={tour.coverImageUrl ?? null} />

        {/* Tour info */}
        <TourInfoEditor tour={{
          id: tour.id,
          title: tour.title,
          titleEn: tour.titleEn,
          description: tour.description,
          countries: tour.countries,
          primaryCountry: tour.primaryCountry,
          cities: tour.cities,
          startDate: tour.startDate.toISOString(),
          endDate: tour.endDate.toISOString(),
          timezone: tour.timezone,
          maxMembers: tour.maxMembers,
          tourCode: tour.tourCode,
          currency: tour.currency,
          destCurrency: tour.destCurrency,
          isChina: tour.isChina,
        }} />
      </div>
    </div>
  )

  /* ── Other tab contents ───────────────────────────────── */
  const flightsContent = (
    <div className="max-w-3xl">
      <FlightsManager
        tourId={tour.id}
        initialFlights={tour.flights.map((f) => ({
          ...f,
          departAt: f.departAt.toISOString(),
          arriveAt: f.arriveAt.toISOString(),
        }))}
      />
    </div>
  )

  const contactsContent = (
    <div className="max-w-3xl">
      <ContactsManager tourId={tour.id} initialContacts={tour.contacts} />
    </div>
  )

  const checklistsContent = (
    <div className="max-w-3xl">
      <ChecklistsManager
        tourId={tour.id}
        initialChecklists={tour.checklists.map(cl => ({
          ...cl,
          items: cl.items.map(item => ({
            id: item.id,
            label: item.label,
            labelEn: item.labelEn,
            isImportant: item.isImportant,
            order: item.order,
          })),
        }))}
      />
    </div>
  )

  const documentsContent = (
    <div className="max-w-3xl">
      <DocumentsManager
        tourId={tour.id}
        initialDocuments={tour.documents}
        members={tour.members.map(m => ({ userId: m.user.id, name: m.user.name }))}
      />
    </div>
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/tours" className="text-gray-500 hover:text-gray-700 text-sm">← ทัวร์ทั้งหมด</a>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{tour.title}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {tour.isChina && <span className="text-red-500 mr-1">🇨🇳 China Mode</span>}
              {new Date(tour.startDate).toLocaleDateString('th-TH')} — {new Date(tour.endDate).toLocaleDateString('th-TH')}
              {' · '}{tour._count.members} สมาชิก
            </p>
          </div>
        </div>
        <TourDetailClient tour={tour} />
      </div>

      {/* Tabbed content */}
      <TourTabs
        overviewContent={overviewContent}
        flightsContent={flightsContent}
        contactsContent={contactsContent}
        checklistsContent={checklistsContent}
        documentsContent={documentsContent}
      />
    </div>
  )
}
