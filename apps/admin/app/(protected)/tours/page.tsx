import { db } from '@tripflow/database'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getCached, setCache } from '@/lib/cache'

export const metadata: Metadata = { title: 'จัดการทัวร์ — TripFlow Admin' }
export const revalidate = 300

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  DRAFT:     { label: 'ฉบับร่าง',     dot: 'bg-gray-400',   bg: 'bg-gray-50',    text: 'text-gray-600' },
  PUBLISHED: { label: 'เผยแพร่แล้ว',  dot: 'bg-blue-500',   bg: 'bg-blue-50',    text: 'text-blue-700' },
  ACTIVE:    { label: 'กำลังเดินทาง', dot: 'bg-green-500',  bg: 'bg-green-50',   text: 'text-green-700' },
  COMPLETED: { label: 'เสร็จสิ้น',    dot: 'bg-violet-500', bg: 'bg-violet-50',  text: 'text-violet-700' },
  CANCELLED: { label: 'ยกเลิก',       dot: 'bg-red-500',    bg: 'bg-red-50',     text: 'text-red-700' },
}

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷', VN: '🇻🇳',
  IT: '🇮🇹', GB: '🇬🇧', SG: '🇸🇬', AU: '🇦🇺', DE: '🇩🇪', MY: '🇲🇾', ID: '🇮🇩', PH: '🇵🇭', MM: '🇲🇲', LA: '🇱🇦', KH: '🇰🇭', TW: '🇹🇼', HK: '🇭🇰', IN: '🇮🇳', AE: '🇦🇪', TR: '🇹🇷', ES: '🇪🇸', NL: '🇳🇱', CH: '🇨🇭', US: '🇺🇸', CA: '🇨🇦', NZ: '🇳🇿', BR: '🇧🇷', EG: '🇪🇬', ZA: '🇿🇦',
}

async function getToursData() {
  const cached = getCached<Awaited<ReturnType<typeof queryTours>>>('admin:tours')
  if (cached) return cached
  const data = await queryTours()
  setCache('admin:tours', data, 60_000)
  return data
}

function queryTours() {
  return db.tour.findMany({
    select: {
      id: true, title: true, titleEn: true, startDate: true, endDate: true,
      primaryCountry: true, countries: true, cities: true, isChina: true,
      status: true, coverImageUrl: true, tourCode: true,
      _count: { select: { members: true } },
      days: { select: { id: true } },
    },
    orderBy: { startDate: 'desc' },
  })
}

export default async function ToursPage() {
  const tours = await getToursData()

  const now = new Date()
  const active = tours.filter(t => t.status === 'ACTIVE' || t.status === 'PUBLISHED')
  const draft = tours.filter(t => t.status === 'DRAFT')
  const past = tours.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">จัดการทัวร์</h1>
          <p className="text-gray-400 text-sm mt-1">{tours.length} ทัวร์ · {active.length} กำลังดำเนินการ</p>
        </div>
        <Link
          href="/tours/new"
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 shadow-sm shadow-indigo-200/50 hover:shadow-md transition-all text-center text-sm"
        >
          + สร้างทัวร์ใหม่
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'ทั้งหมด', value: tours.length, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', numColor: 'text-indigo-700', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>) },
          { label: 'กำลังดำเนินการ', value: active.length, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', numColor: 'text-emerald-700', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>) },
          { label: 'ฉบับร่าง', value: draft.length, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', numColor: 'text-amber-700', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>) },
          { label: 'เสร็จสิ้น', value: past.length, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', numColor: 'text-violet-700', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>) },
        ].map(s => (
          <div key={s.label} className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                <p className={`text-3xl font-black mt-1 ${s.numColor}`}>{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} ${s.iconColor} flex items-center justify-center`}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {tours.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 text-center border border-indigo-100/40">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50/80 backdrop-blur-xl border border-indigo-100/40 flex items-center justify-center mx-auto mb-4">
            <svg className="w-9 h-9 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg>
          </div>
          <p className="font-bold text-gray-900 text-lg">ยังไม่มีทัวร์</p>
          <p className="text-gray-500 text-sm mt-2 mb-6 max-w-xs mx-auto">เริ่มสร้างทัวร์แรกของคุณได้เลย</p>
          <Link href="/tours/new" className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 shadow-sm shadow-indigo-200/50">
            + สร้างทัวร์ใหม่
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {tours.map((tour) => {
            const status = statusConfig[tour.status] ?? statusConfig['DRAFT']!
            const daysCount = tour.days.length
            const startDate = new Date(tour.startDate)
            const endDate = new Date(tour.endDate)
            const isUpcoming = startDate > now
            const daysUntil = isUpcoming ? Math.ceil((startDate.getTime() - now.getTime()) / 86400000) : 0

            return (
              <Link
                key={tour.id}
                href={`/tours/${tour.id}`}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200/60 transition-all duration-300"
              >
                {/* Cover or gradient header */}
                {tour.coverImageUrl ? (
                  <div className="h-32 relative overflow-hidden">
                    <Image src={tour.coverImageUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                      {tour.countries.map((c) => (
                        <span key={c} className="text-xl drop-shadow-lg">{countryFlags[c] ?? '🌍'}</span>
                      ))}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-br from-indigo-500 to-violet-500 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                      {tour.countries.map((c) => (
                        <span key={c} className="text-xl drop-shadow-lg">{countryFlags[c] ?? '🌍'}</span>
                      ))}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                    {tour.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {tour.isChina && <span className="text-red-500 font-medium mr-1">CN</span>}
                    {tour.tourCode && <span className="font-mono mr-1">{tour.tourCode}</span>}
                    {tour.cities.slice(0, 3).join(' · ')}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-indigo-50/40">
                    <div className="flex gap-3 text-[11px] text-gray-400">
                      <span>{startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} — {endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="flex gap-2 text-[11px]">
                      <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-medium">{daysCount} วัน</span>
                      <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-medium">{tour._count.members} คน</span>
                    </div>
                  </div>

                  {isUpcoming && daysUntil > 0 && (
                    <p className="text-[10px] text-indigo-500 font-semibold mt-2">ออกเดินทางใน {daysUntil} วัน</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
