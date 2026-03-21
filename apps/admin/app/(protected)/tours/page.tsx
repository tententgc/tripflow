import { db } from '@tripflow/database'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'จัดการทัวร์ — TripFlow Admin' }

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  DRAFT:     { label: 'ฉบับร่าง',     dot: 'bg-gray-400',   bg: 'bg-gray-50',    text: 'text-gray-600' },
  PUBLISHED: { label: 'เผยแพร่แล้ว',  dot: 'bg-blue-500',   bg: 'bg-blue-50',    text: 'text-blue-700' },
  ACTIVE:    { label: 'กำลังเดินทาง', dot: 'bg-green-500',  bg: 'bg-green-50',   text: 'text-green-700' },
  COMPLETED: { label: 'เสร็จสิ้น',    dot: 'bg-violet-500', bg: 'bg-violet-50',  text: 'text-violet-700' },
  CANCELLED: { label: 'ยกเลิก',       dot: 'bg-red-500',    bg: 'bg-red-50',     text: 'text-red-700' },
}

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷',
  IT: '🇮🇹', GB: '🇬🇧', SG: '🇸🇬', AU: '🇦🇺', DE: '🇩🇪',
}

export default async function ToursPage() {
  const tours = await db.tour.findMany({
    include: { _count: { select: { members: true } }, days: { select: { id: true } } },
    orderBy: { startDate: 'desc' },
  })

  const now = new Date()
  const active = tours.filter(t => t.status === 'ACTIVE' || t.status === 'PUBLISHED')
  const draft = tours.filter(t => t.status === 'DRAFT')
  const past = tours.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการทัวร์</h1>
          <p className="text-gray-400 text-sm mt-1">{tours.length} ทัวร์ · {active.length} กำลังดำเนินการ</p>
        </div>
        <a
          href="/tours/new"
          className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all"
        >
          + สร้างทัวร์ใหม่
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'ทั้งหมด', value: tours.length, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', numColor: 'text-indigo-700', icon: '📊' },
          { label: 'กำลังดำเนินการ', value: active.length, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', numColor: 'text-emerald-700', icon: '✈️' },
          { label: 'ฉบับร่าง', value: draft.length, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', numColor: 'text-amber-700', icon: '📝' },
          { label: 'เสร็จสิ้น', value: past.length, iconBg: 'bg-violet-100', iconColor: 'text-violet-600', numColor: 'text-violet-700', icon: '✅' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                <p className={`text-3xl font-black mt-1 ${s.numColor}`}>{s.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${s.iconBg} flex items-center justify-center text-2xl`}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {tours.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🗺️</span>
          </div>
          <p className="font-bold text-gray-900 text-lg">ยังไม่มีทัวร์</p>
          <p className="text-gray-500 text-sm mt-2 mb-6 max-w-xs mx-auto">เริ่มสร้างทัวร์แรกของคุณได้เลย</p>
          <a href="/tours/new" className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm">
            + สร้างทัวร์ใหม่
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tours.map((tour) => {
            const status = statusConfig[tour.status] ?? statusConfig['DRAFT']!
            const daysCount = tour.days.length
            const startDate = new Date(tour.startDate)
            const endDate = new Date(tour.endDate)
            const isUpcoming = startDate > now
            const daysUntil = isUpcoming ? Math.ceil((startDate.getTime() - now.getTime()) / 86400000) : 0

            return (
              <a
                key={tour.id}
                href={`/tours/${tour.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300"
              >
                {/* Cover or gradient header */}
                {tour.coverImageUrl ? (
                  <div className="h-32 relative overflow-hidden">
                    <img src={tour.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex gap-3 text-[11px] text-gray-400">
                      <span>📅 {startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} — {endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
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
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
