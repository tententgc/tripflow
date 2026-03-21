import { db } from '@tripflow/database'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'แดชบอร์ด — TripFlow Admin' }

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷',
  IT: '🇮🇹', GB: '🇬🇧', SG: '🇸🇬', AU: '🇦🇺', DE: '🇩🇪',
}

const statusDot: Record<string, string> = {
  DRAFT: 'bg-gray-400', PUBLISHED: 'bg-blue-500', ACTIVE: 'bg-green-500',
  COMPLETED: 'bg-violet-500', CANCELLED: 'bg-red-500',
}
const statusLabel: Record<string, string> = {
  DRAFT: 'ฉบับร่าง', PUBLISHED: 'เผยแพร่', ACTIVE: 'กำลังเดินทาง',
  COMPLETED: 'เสร็จสิ้น', CANCELLED: 'ยกเลิก',
}

export default async function DashboardPage() {
  const now = new Date()

  const [
    allTours, travelerCount, totalExpenses,
    upcomingTours, recentTravelers, activeTourCount,
    draftCount, completedCount,
  ] = await Promise.all([
    db.tour.findMany({ include: { _count: { select: { members: true } } }, orderBy: { startDate: 'asc' } }),
    db.user.count(),
    db.expense.aggregate({ _sum: { amountTHB: true } }),
    db.tour.findMany({
      where: { startDate: { gte: now }, status: { in: ['PUBLISHED', 'ACTIVE', 'DRAFT'] } },
      include: { _count: { select: { members: true } } },
      orderBy: { startDate: 'asc' },
      take: 5,
    }),
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
    }),
    db.tour.count({ where: { status: { in: ['PUBLISHED', 'ACTIVE'] } } }),
    db.tour.count({ where: { status: 'DRAFT' } }),
    db.tour.count({ where: { status: 'COMPLETED' } }),
  ])

  const totalMembers = allTours.reduce((s, t) => s + t._count.members, 0)
  const totalExpensesTHB = totalExpenses._sum.amountTHB ?? 0

  // Nearest departing tour
  const nextTour = upcomingTours[0]
  const daysUntilNext = nextTour ? Math.ceil((new Date(nextTour.startDate).getTime() - now.getTime()) / 86400000) : null

  // Country distribution
  const countryCount: Record<string, number> = {}
  for (const t of allTours) {
    for (const c of t.countries) {
      countryCount[c] = (countryCount[c] ?? 0) + 1
    }
  }
  const topCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-400 text-sm mt-1">ภาพรวมระบบจัดการทัวร์ TripFlow</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <p className="text-xs text-white/70 font-medium">ทัวร์ทั้งหมด</p>
          <p className="text-3xl font-black mt-1">{allTours.length}</p>
          <p className="text-[10px] text-white/50 mt-1">{activeTourCount} กำลังดำเนินการ</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <p className="text-xs text-white/70 font-medium">นักเดินทาง</p>
          <p className="text-3xl font-black mt-1">{travelerCount}</p>
          <p className="text-[10px] text-white/50 mt-1">{totalMembers} สมาชิกในทัวร์</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <p className="text-xs text-white/70 font-medium">ค่าใช้จ่ายรวม</p>
          <p className="text-3xl font-black mt-1">฿{totalExpensesTHB.toLocaleString()}</p>
          <p className="text-[10px] text-white/50 mt-1">บันทึกทั้งหมด</p>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <p className="text-xs text-white/70 font-medium">ทัวร์ถัดไป</p>
          {daysUntilNext != null ? (
            <>
              <p className="text-3xl font-black mt-1">{daysUntilNext} <span className="text-lg font-medium">วัน</span></p>
              <p className="text-[10px] text-white/50 mt-1 truncate">{nextTour?.title}</p>
            </>
          ) : (
            <p className="text-lg font-medium mt-2 text-white/60">ไม่มีทัวร์</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming tours — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">✈️ ทัวร์ที่กำลังจะออกเดินทาง</h2>
            <a href="/tours" className="text-indigo-600 text-xs font-medium hover:underline">ดูทั้งหมด →</a>
          </div>
          {upcomingTours.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-3xl mb-2">🗺️</p>
              <p className="text-gray-400 text-sm">ยังไม่มีทัวร์ที่จะมาถึง</p>
              <a href="/tours/new" className="mt-3 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
                + สร้างทัวร์
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcomingTours.map((tour) => {
                const days = Math.ceil((new Date(tour.startDate).getTime() - now.getTime()) / 86400000)
                return (
                  <a key={tour.id} href={`/tours/${tour.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{countryFlags[tour.primaryCountry] ?? '🌍'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{tour.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {tour.isChina && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold">CN</span>}
                        <span className="text-xs text-gray-400">
                          {new Date(tour.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{tour._count.members} คน</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-sm font-bold ${days <= 7 ? 'text-red-500' : days <= 14 ? 'text-amber-500' : 'text-indigo-600'}`}>
                        {days} วัน
                      </p>
                      <p className="text-[10px] text-gray-300">ก่อนออกเดินทาง</p>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Popular destinations */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3">🌏 ประเทศยอดนิยม</h3>
            {topCountries.length === 0 ? (
              <p className="text-xs text-gray-400">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-2">
                {topCountries.map(([code, count]) => (
                  <div key={code} className="flex items-center gap-3">
                    <span className="text-xl">{countryFlags[code] ?? '🌍'}</span>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full"
                          style={{ width: `${(count / allTours.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent travelers */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">👤 นักเดินทางล่าสุด</h3>
              <a href="/travelers" className="text-indigo-600 text-[10px] font-medium hover:underline">ดูทั้งหมด</a>
            </div>
            <div className="space-y-2">
              {recentTravelers.map((u) => (
                <div key={u.id} className="flex items-center gap-2.5 py-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-xs font-bold text-indigo-600">{u.name[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{u.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3">📊 สถานะทัวร์</h3>
            <div className="space-y-2">
              {Object.entries(statusLabel).map(([key, label]) => {
                const count = allTours.filter(t => t.status === key).length
                if (count === 0) return null
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusDot[key] ?? 'bg-gray-400'}`} />
                    <span className="text-xs text-gray-600 flex-1">{label}</span>
                    <span className="text-xs font-bold text-gray-800">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
