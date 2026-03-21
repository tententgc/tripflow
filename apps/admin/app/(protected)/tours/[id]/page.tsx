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
            {tour.days.map((day, i) => {
              const colors = ['from-blue-500 to-indigo-500', 'from-violet-500 to-purple-500', 'from-pink-500 to-rose-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-cyan-500 to-sky-500', 'from-red-500 to-rose-500']
              const bg = colors[i % colors.length]
              return (
                <a key={day.id} href={`/tours/${tour.id}/itinerary`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${bg}`} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm`}>
                        {day.dayNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors">{day.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(day.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                          {day.city && ` · ${day.city}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                      <div className="flex gap-1">
                        {day.mealBreakfast && <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-full">🍳</span>}
                        {day.mealLunch && <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full">🍱</span>}
                        {day.mealDinner && <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-full">🍽️</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">{day.activities.length} กิจกรรม{day.accommodation ? ' · 🏨' : ''}</p>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="space-y-4">
        {/* Members */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">👥 สมาชิก ({tour._count.members})</h3>
            <a href={`/tours/${tour.id}/members`} className="text-blue-600 text-xs hover:underline">จัดการ →</a>
          </div>
          {tour.members.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-2">ยังไม่มีสมาชิก</p>
          ) : (
            <div className="space-y-1.5">
              {tour.members.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-xs font-bold text-indigo-600 overflow-hidden flex-shrink-0">
                    {m.user.avatarUrl ? (
                      <img src={m.user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : m.user.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{m.user.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{m.user.email}</p>
                  </div>
                </div>
              ))}
              {tour.members.length > 5 && (
                <p className="text-xs text-gray-400 text-center pt-1">+{tour.members.length - 5} คน</p>
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

  const totalActivities = tour.days.reduce((s, d) => s + d.activities.length, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <a href="/tours" className="text-gray-400 hover:text-gray-600 text-xs font-medium mb-3 inline-block transition-colors">← ทัวร์ทั้งหมด</a>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {tour.countries.map(c => (
                    <span key={c} className="text-xl">{({'CN':'🇨🇳','JP':'🇯🇵','KR':'🇰🇷','TH':'🇹🇭','FR':'🇫🇷','IT':'🇮🇹','SG':'🇸🇬'} as Record<string,string>)[c] ?? '🌍'}</span>
                  ))}
                  {tour.isChina && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">🇨🇳 China Mode</span>}
                </div>
                <h1 className="text-xl font-bold text-gray-900">{tour.title}</h1>
                <p className="text-gray-400 text-sm mt-1">
                  {new Date(tour.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} — {new Date(tour.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <TourDetailClient tour={tour} />
            </div>

            {/* Stats row */}
            <div className="flex gap-3 mt-5">
              {[
                { label: 'วัน', value: tour.days.length, icon: '📅', color: 'bg-blue-50 text-blue-600' },
                { label: 'สมาชิก', value: tour._count.members, icon: '👥', color: 'bg-violet-50 text-violet-600' },
                { label: 'เที่ยวบิน', value: tour.flights.length, icon: '✈️', color: 'bg-sky-50 text-sky-600' },
                { label: 'กิจกรรม', value: totalActivities, icon: '📍', color: 'bg-amber-50 text-amber-600' },
                { label: 'เอกสาร', value: tour.documents.length, icon: '🎫', color: 'bg-emerald-50 text-emerald-600' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.color} rounded-xl px-4 py-2.5`}>
                  <p className="text-[10px] font-medium opacity-70">{stat.icon} {stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
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
