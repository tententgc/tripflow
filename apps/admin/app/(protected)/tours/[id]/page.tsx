import { db } from '@tripflow/database'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCached, setCache } from '@/lib/cache'
import TourDetailClient from './TourDetailClient'
import CoverImageEditor from './CoverImageEditor'
import FlightsManager from './FlightsManager'
import ContactsManager from './ContactsManager'
import TourInfoEditor from './TourInfoEditor'
import ChecklistsManager from './ChecklistsManager'
import DocumentsManager from './DocumentsManager'
import AnnouncementsManager from './AnnouncementsManager'
import HotelsManager from './HotelsManager'
import TourTabs from './TourTabs'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = { title: 'จัดการทัวร์ — TripFlow Admin' }

async function getTourData(id: string) {
  const cacheKey = `admin:tour:${id}`
  const cached = getCached(cacheKey)
  if (cached) return cached as NonNullable<Awaited<ReturnType<typeof fetchTourData>>>

  const data = await fetchTourData(id)
  if (data) setCache(cacheKey, data, 60_000)
  return data
}

async function fetchTourData(id: string) {
  const tourCore = await db.tour.findUnique({
    where: { id },
    select: {
      id: true, title: true, titleEn: true, description: true,
      isChina: true, status: true, primaryCountry: true, countries: true,
      cities: true, startDate: true, endDate: true, timezone: true,
      currency: true, destCurrency: true, coverImageUrl: true,
      tourCode: true, maxMembers: true,
    },
  })
  if (!tourCore) return null

  const [days, members, flights, contacts, checklists, documents, announcements, memberCount] = await Promise.all([
    db.tourDay.findMany({
      where: { tourId: id },
      include: { activities: { orderBy: { order: 'asc' } }, accommodation: true },
      orderBy: { dayNumber: 'asc' },
    }),
    db.tourMember.findMany({
      where: { tourId: id },
      include: { user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } } },
    }),
    db.flightInfo.findMany({ where: { tourId: id }, orderBy: { departAt: 'asc' } }),
    db.importantContact.findMany({ where: { tourId: id } }),
    db.checklist.findMany({
      where: { tourId: id },
      include: { items: { orderBy: { order: 'asc' } } },
    }),
    db.tourDocument.findMany({ where: { tourId: id } }),
    db.tourAnnouncement.findMany({
      where: { tourId: id },
      orderBy: [{ isPinned: 'desc' }, { order: 'asc' }],
    }),
    db.tourMember.count({ where: { tourId: id } }),
  ])

  return { ...tourCore, days, members, flights, contacts, checklists, documents, announcements, _count: { members: memberCount } }
}

export default async function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const tour = await getTourData(id)
  if (!tour) notFound()

  /* ── Compute unique hotels for stats + hotels tab ───── */
  const hotelMap = new Map<string, {
    name: string
    nameLocal: string | null
    address: string | null
    phone: string | null
    checkIn: string | null
    checkOut: string | null
    checkInDate: string | null
    checkOutDate: string | null
    confirmationNo: string | null
    wifiName: string | null
    wifiPassword: string | null
    roomType: string | null
    imageUrl: string | null
    notes: string | null
    dayNumbers: number[]
  }>()
  for (const day of tour.days) {
    if (!day.accommodation) continue
    const a = day.accommodation
    const key = a.name.trim().toLowerCase()
    if (hotelMap.has(key)) {
      hotelMap.get(key)!.dayNumbers.push(day.dayNumber)
    } else {
      hotelMap.set(key, {
        name: a.name,
        nameLocal: a.nameLocal,
        address: a.address,
        phone: a.phone,
        checkIn: a.checkIn,
        checkOut: a.checkOut,
        checkInDate: a.checkInDate ? new Date(a.checkInDate).toISOString() : null,
        checkOutDate: a.checkOutDate ? new Date(a.checkOutDate).toISOString() : null,
        confirmationNo: a.confirmationNo,
        wifiName: a.wifiName,
        wifiPassword: a.wifiPassword,
        roomType: a.roomType,
        imageUrl: a.imageUrl,
        notes: a.notes,
        dayNumbers: [day.dayNumber],
      })
    }
  }

  /* ── Overview tab content ─────────────────────────────── */
  const overviewContent = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Left: Days summary */}
      <div className="lg:col-span-2 space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">กำหนดการ ({tour.days.length} วัน)</h2>
          <Link href={`/tours/${tour.id}/itinerary`} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-all">
            แก้ไขกำหนดการ
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>

        {tour.days.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 text-center border border-white/60">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-gray-600 font-medium">ยังไม่มีกำหนดการ</p>
            <p className="text-gray-400 text-sm mt-1">เพิ่มวันเดินทางเพื่อเริ่มสร้างกำหนดการ</p>
            <Link href={`/tours/${tour.id}/itinerary`} className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
              + เพิ่มกำหนดการ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tour.days.map((day) => {
              const dayOfWeek = new Date(day.date).getDay()
              const dayColors = [
                'from-red-500 to-rose-500',
                'from-yellow-400 to-amber-500',
                'from-pink-400 to-pink-500',
                'from-green-500 to-emerald-500',
                'from-orange-400 to-orange-500',
                'from-blue-500 to-indigo-500',
                'from-violet-500 to-purple-500',
              ]
              const bg = dayColors[dayOfWeek] ?? dayColors[0]
              return (
                <Link key={day.id} href={`/tours/${tour.id}/itinerary`}
                  className="group bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:shadow-lg hover:bg-white/70 hover:border-indigo-200/60 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
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
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${day.mealBreakfast ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-300 line-through'}`}>เช้า</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${day.mealLunch ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-300 line-through'}`}>กลางวัน</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${day.mealDinner ? 'bg-violet-50 text-violet-600' : 'bg-gray-50 text-gray-300 line-through'}`}>เย็น</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">{day.activities.length} กิจกรรม{day.accommodation ? ' · ที่พัก' : ''}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="space-y-4">
        <CoverImageEditor tourId={tour.id} currentUrl={tour.coverImageUrl ?? null} />

        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 text-sm">สมาชิก</h3>
            <Link href={`/tours/${tour.id}/members`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all">
              จัดการ
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>

          {tour.members.length > 0 && (
            <div className="flex items-center mb-3">
              <div className="flex -space-x-2">
                {tour.members.slice(0, 6).map((m) => (
                  <div key={m.id} className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                    {m.user.avatarUrl ? (
                      <Image src={m.user.avatarUrl} alt="" width={36} height={36} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                    ) : (
                      <span className="text-xs font-bold text-indigo-600">{m.user.name[0]}</span>
                    )}
                  </div>
                ))}
                {tour.members.length > 6 && (
                  <div className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-gray-500">+{tour.members.length - 6}</span>
                  </div>
                )}
              </div>
              <span className="ml-3 text-xs text-gray-400">{tour._count.members} คน</span>
            </div>
          )}

          <div className="space-y-1">
            {tour.members.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-1 px-1 rounded-md hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-800 truncate">{m.user.name}</span>
                <span className="text-[10px] text-gray-300 truncate">{m.user.email}</span>
              </div>
            ))}
          </div>
        </div>

        <TourInfoEditor tour={{
          id: tour.id,
          title: tour.title,
          titleEn: tour.titleEn,
          description: tour.description,
          countries: tour.countries,
          primaryCountry: tour.primaryCountry,
          cities: tour.cities,
          startDate: typeof tour.startDate === 'string' ? tour.startDate : new Date(tour.startDate).toISOString(),
          endDate: typeof tour.endDate === 'string' ? tour.endDate : new Date(tour.endDate).toISOString(),
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

  /* ── Hotels tab content ──────────────────────────────── */
  const initialHotels = Array.from(hotelMap.values()).map((h, i) => ({ id: `hotel-${i}`, ...h }))
  const tourDaysForHotels = tour.days.map(d => ({
    id: d.id,
    dayNumber: d.dayNumber,
    date: typeof d.date === 'string' ? d.date : new Date(d.date).toISOString(),
  }))

  const hotelsContent = (
    <div className="max-w-3xl">
      <HotelsManager
        tourId={tour.id}
        initialHotels={initialHotels}
        tourDays={tourDaysForHotels}
      />
    </div>
  )

  /* ── Other tab contents ───────────────────────────────── */
  const flightsContent = (
    <div className="max-w-3xl">
      <FlightsManager
        tourId={tour.id}
        initialFlights={tour.flights.map((f) => ({
          ...f,
          departAt: typeof f.departAt === 'string' ? f.departAt : new Date(f.departAt).toISOString(),
          arriveAt: typeof f.arriveAt === 'string' ? f.arriveAt : new Date(f.arriveAt).toISOString(),
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

  const announcementsContent = (
    <div className="max-w-3xl">
      <AnnouncementsManager
        tourId={tour.id}
        initialAnnouncements={tour.announcements.map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          imageUrls: a.imageUrls,
          order: a.order,
          isPinned: a.isPinned,
          createdAt: typeof a.createdAt === 'string' ? a.createdAt : new Date(a.createdAt).toISOString(),
        }))}
      />
    </div>
  )

  const totalActivities = tour.days.reduce((s, d) => s + d.activities.length, 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/tours" className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-100 rounded-xl transition-colors font-medium mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          กลับ
        </Link>

        <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-visible relative">
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-t-2xl" />

          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {tour.countries.map(c => (
                    <span key={c} className="text-xl">{({'CN':'🇨🇳','JP':'🇯🇵','KR':'🇰🇷','TH':'🇹🇭','FR':'🇫🇷','IT':'🇮🇹','SG':'🇸🇬'} as Record<string,string>)[c] ?? '🌍'}</span>
                  ))}
                  {tour.isChina && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">China Mode</span>}
                </div>
                <h1 className="text-xl font-bold text-gray-900">{tour.title}</h1>
                <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  {new Date(tour.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} — {new Date(tour.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <TourDetailClient tour={tour} />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5 mt-5">
              {[
                { label: 'วัน', value: tour.days.length, icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                { label: 'สมาชิก', value: tour._count.members, icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>, color: 'bg-violet-50 text-violet-600 border-violet-100' },
                { label: 'ที่พัก', value: hotelMap.size, icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" /></svg>, color: 'bg-sky-50 text-sky-600 border-sky-100' },
                { label: 'เที่ยวบิน', value: tour.flights.length, icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>, color: 'bg-amber-50 text-amber-600 border-amber-100' },
                { label: 'กิจกรรม', value: totalActivities, icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>, color: 'bg-orange-50 text-orange-600 border-orange-100' },
                { label: 'เอกสาร', value: tour.documents.length, icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.color} border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2`}>
                  <div className="flex flex-col items-center">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium opacity-60">{stat.label}</p>
                    <p className="text-base sm:text-lg font-bold leading-tight">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <TourTabs
        overviewContent={overviewContent}
        hotelsContent={hotelsContent}
        flightsContent={flightsContent}
        contactsContent={contactsContent}
        checklistsContent={checklistsContent}
        documentsContent={documentsContent}
        announcementsContent={announcementsContent}
      />
    </div>
  )
}
