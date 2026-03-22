import { db } from '@tripflow/database'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getCached, setCache } from '@/lib/cache'

export const metadata: Metadata = { title: 'แดชบอร์ด — TripFlow Admin' }
export const revalidate = 300

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷', VN: '🇻🇳',
  IT: '🇮🇹', GB: '🇬🇧', SG: '🇸🇬', AU: '🇦🇺', DE: '🇩🇪', MY: '🇲🇾', ID: '🇮🇩', PH: '🇵🇭', MM: '🇲🇲', LA: '🇱🇦', KH: '🇰🇭', TW: '🇹🇼', HK: '🇭🇰', IN: '🇮🇳', AE: '🇦🇪', TR: '🇹🇷', ES: '🇪🇸', NL: '🇳🇱', CH: '🇨🇭', US: '🇺🇸', CA: '🇨🇦', NZ: '🇳🇿', BR: '🇧🇷', EG: '🇪🇬', ZA: '🇿🇦',
}

const statusDot: Record<string, string> = {
  DRAFT: 'bg-gray-400', PUBLISHED: 'bg-blue-500', ACTIVE: 'bg-green-500',
  COMPLETED: 'bg-violet-500', CANCELLED: 'bg-red-500',
}
const statusLabel: Record<string, string> = {
  DRAFT: 'ฉบับร่าง', PUBLISHED: 'เผยแพร่', ACTIVE: 'กำลังเดินทาง',
  COMPLETED: 'เสร็จสิ้น', CANCELLED: 'ยกเลิก',
}

type TourSummary = { id: string; title: string; startDate: Date | string; endDate: Date | string; primaryCountry: string; countries: string[]; isChina: boolean; status: string; coverImageUrl: string | null; tourCode: string | null; cities: string[]; _count: { members: number } }
type RecentUser = { id: string; name: string; email: string; avatarUrl: string | null; createdAt: Date | string }
type DashData = { allTours: TourSummary[]; travelerCount: number; totalExpensesTHB: number; recentTravelers: RecentUser[]; totalMembers: number; activeTourCount: number; draftCount: number; completedCount: number; upcomingTours: TourSummary[]; nextTour: TourSummary | undefined; daysUntilNext: number | null; topCountries: [string, number][] }

async function getDashboardData(): Promise<DashData> {
  const cached = getCached<DashData>('admin:dashboard')
  if (cached) return cached

  const now = new Date()
  const [allTours, travelerCount, totalExpenses, recentTravelers] = await Promise.all([
    db.tour.findMany({
      select: {
        id: true, title: true, startDate: true, endDate: true,
        primaryCountry: true, countries: true, isChina: true, status: true,
        coverImageUrl: true, tourCode: true, cities: true,
        _count: { select: { members: true } },
      },
      orderBy: { startDate: 'asc' },
    }),
    db.user.count(),
    db.expense.aggregate({ _sum: { amountTHB: true } }),
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
    }),
  ])

  const totalMembers = allTours.reduce((s, t) => s + t._count.members, 0)
  const totalExpensesTHB = totalExpenses._sum.amountTHB ?? 0
  const activeTourCount = allTours.filter(t => t.status === 'PUBLISHED' || t.status === 'ACTIVE').length
  const draftCount = allTours.filter(t => t.status === 'DRAFT').length
  const completedCount = allTours.filter(t => t.status === 'COMPLETED').length
  const upcomingTours = allTours
    .filter(t => new Date(t.startDate) >= now && ['PUBLISHED', 'ACTIVE', 'DRAFT'].includes(t.status))
    .slice(0, 5)
  const nextTour = upcomingTours[0]
  const daysUntilNext = nextTour ? Math.ceil((new Date(nextTour.startDate).getTime() - now.getTime()) / 86400000) : null
  const countryCount: Record<string, number> = {}
  for (const t of allTours) { for (const c of t.countries) { countryCount[c] = (countryCount[c] ?? 0) + 1 } }
  const topCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const data = {
    allTours, travelerCount, totalExpensesTHB, recentTravelers,
    totalMembers, activeTourCount, draftCount, completedCount,
    upcomingTours, nextTour, daysUntilNext, topCountries,
  }
  setCache('admin:dashboard', data, 60_000)
  return data
}


export default async function DashboardPage() {
  const now = new Date()
  const {
    allTours, travelerCount, totalExpensesTHB, recentTravelers,
    totalMembers, activeTourCount, draftCount, completedCount,
    upcomingTours, nextTour, daysUntilNext, topCountries,
  } = await getDashboardData()

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-400 text-sm mt-1">ภาพรวมระบบจัดการทัวร์ TripFlow</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100/40 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-indigo-400/10 blur-xl" />
          <p className="text-xs text-gray-500 font-medium">ทัวร์ทั้งหมด</p>
          <p className="text-3xl font-black mt-1 text-indigo-600">{allTours.length}</p>
          <p className="text-[10px] text-gray-400 mt-1">{activeTourCount} กำลังดำเนินการ</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100/40 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-emerald-400/10 blur-xl" />
          <p className="text-xs text-gray-500 font-medium">นักเดินทาง</p>
          <p className="text-3xl font-black mt-1 text-emerald-600">{travelerCount}</p>
          <p className="text-[10px] text-gray-400 mt-1">{totalMembers} สมาชิกในทัวร์</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100/40 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber-400/10 blur-xl" />
          <p className="text-xs text-gray-500 font-medium">ค่าใช้จ่ายรวม</p>
          <p className="text-2xl sm:text-3xl font-black mt-1 text-amber-600 truncate">฿{totalExpensesTHB.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">บันทึกทั้งหมด</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-indigo-100/40 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-rose-400/10 blur-xl" />
          <p className="text-xs text-gray-500 font-medium">ทัวร์ถัดไป</p>
          {daysUntilNext != null ? (
            <>
              <p className="text-3xl font-black mt-1 text-rose-600">{daysUntilNext} <span className="text-lg font-medium">วัน</span></p>
              <p className="text-[10px] text-gray-400 mt-1 truncate">{nextTour?.title}</p>
            </>
          ) : (
            <p className="text-lg font-medium mt-2 text-gray-400">ไม่มีทัวร์</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Upcoming tours — 2 cols */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-indigo-100/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-indigo-50/40 bg-gradient-to-r from-indigo-50/50 to-violet-50/30 flex items-center justify-between">
            <h2 className="text-indigo-500 font-semibold text-sm">ทัวร์ที่กำลังจะออกเดินทาง</h2>
            <Link href="/tours" className="text-indigo-600 text-xs font-medium hover:underline">ดูทั้งหมด →</Link>
          </div>
          {upcomingTours.length === 0 ? (
            <div className="p-10 text-center">
              <svg className="mx-auto mb-2 w-8 h-8 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-11.307l3.588-1.076A.75.75 0 0120.25 5.7v12.6a.75.75 0 01-.559.724l-4.191 1.257a.75.75 0 01-.502-.019L10.5 18l-4.498 1.35A.75.75 0 014.75 18.6V6a.75.75 0 01.559-.724l4.191-1.257a.75.75 0 01.502.019L14.5 6l4.003-1.307z" /></svg>
              <p className="text-gray-400 text-sm">ยังไม่มีทัวร์ที่จะมาถึง</p>
              <Link href="/tours/new" className="mt-3 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
                + สร้างทัวร์
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-indigo-50/40">
              {upcomingTours.map((tour) => {
                const days = Math.ceil((new Date(tour.startDate).getTime() - now.getTime()) / 86400000)
                return (
                  <Link key={tour.id} href={`/tours/${tour.id}`} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 hover:bg-indigo-50/30 transition-colors">
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
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Popular destinations */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-indigo-100/40 p-5">
            <h3 className="text-indigo-500 font-semibold text-sm mb-3">ประเทศยอดนิยม</h3>
            {topCountries.length === 0 ? (
              <p className="text-xs text-gray-400">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-2">
                {topCountries.map(([code, count]) => (
                  <div key={code} className="flex items-center gap-3">
                    <span className="text-xl">{countryFlags[code] ?? '🌍'}</span>
                    <div className="flex-1">
                      <div className="h-2 bg-indigo-50/60 rounded-full overflow-hidden">
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
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-indigo-100/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-indigo-500 font-semibold text-sm">นักเดินทางล่าสุด</h3>
              <Link href="/travelers" className="text-indigo-600 text-[10px] font-medium hover:underline">ดูทั้งหมด</Link>
            </div>
            <div className="space-y-2">
              {recentTravelers.map((u) => (
                <div key={u.id} className="flex items-center gap-2.5 py-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {u.avatarUrl ? (
                      <Image src={u.avatarUrl} alt="" width={32} height={32} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
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
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-indigo-100/40 p-5">
            <h3 className="text-indigo-500 font-semibold text-sm mb-3">สถานะทัวร์</h3>
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
