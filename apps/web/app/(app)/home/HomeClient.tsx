'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useApi } from '@/lib/swr'
import { getTripCountdown } from '@tripflow/utils'

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭',
  FR: '🇫🇷', IT: '🇮🇹', GB: '🇬🇧', DE: '🇩🇪',
  SG: '🇸🇬', AU: '🇦🇺', US: '🇺🇸', MY: '🇲🇾',
  TW: '🇹🇼', VN: '🇻🇳', HK: '🇭🇰',
}

type TourItem = {
  id: string; title: string; coverImageUrl: string | null; countries: string[]
  primaryCountry: string; cities: string[]; startDate: string; endDate: string
  isChina: boolean; status: string
  days: { id: string; mealBreakfast: boolean; mealLunch: boolean; mealDinner: boolean }[]
  _count: { members: number }
}

type HomeData = {
  tours: TourItem[]
  user: { id: string; name: string; avatarUrl: string | null }
}

interface Props {
  initialData: HomeData
}

export default function HomeClient({ initialData }: Props) {
  // SWR auto-refreshes every 15s — picks up admin changes automatically
  const { data } = useApi<HomeData>('/api/my-tours', {
    fallbackData: initialData, // use server-rendered data instantly, then refresh in background
  })

  const tours = data?.tours ?? initialData.tours
  const user = data?.user ?? initialData.user

  const active = tours.filter(t => t.status === 'ACTIVE')
  const upcoming = tours.filter(t => t.status === 'PUBLISHED')
  const history = tours.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed top-[-50px] right-[-30px] w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #a5b4fc 0%, transparent 70%)', opacity: 0.24, filter: 'blur(50px)' }} />
      <div className="fixed top-[28%] left-[-60px] w-[260px] h-[260px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #c4b5fd 0%, transparent 70%)', opacity: 0.3, filter: 'blur(50px)' }} />
      <div className="fixed top-[48%] right-[5%] w-[220px] h-[220px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', opacity: 0.14, filter: 'blur(45px)' }} />
      <div className="fixed bottom-[-60px] right-[-40px] w-[370px] h-[370px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, #a855f7 40%, transparent 70%)', opacity: 0.2, filter: 'blur(60px)' }} />
      <div className="fixed bottom-[15%] left-[9%] w-[220px] h-[220px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', opacity: 0.16, filter: 'blur(45px)' }} />
      <div className="fixed bottom-[-20px] left-[35%] w-[300px] h-[190px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #ddd6fe 0%, transparent 70%)', opacity: 0.36, filter: 'blur(50px)' }} />

      {/* Header — glass with subtle glow */}
      <div className="relative z-10">
        <div className="bg-white/70 backdrop-blur-2xl border-b border-indigo-100/30 px-4 pt-safe-top relative overflow-hidden">
          {/* Subtle glow orbs at bottom border */}
          <div className="absolute bottom-0 left-1/4 w-48 h-8 bg-indigo-200/15 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-1/2 w-40 h-6 bg-violet-200/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-1/4 w-36 h-8 bg-purple-200/12 rounded-full blur-2xl" />
          {/* Combined header row */}
          <div className="relative flex items-center justify-between py-4 max-w-5xl mx-auto">
            {/* Left: logo + greeting */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200/40 flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" opacity="0.4"/>
                  <path d="M5 17L10 12L5 10L18 6L14 19L12 14L5 17Z" fill="white" fillOpacity="0.95"/>
                </svg>
              </div>
              <div>
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 text-[11px] font-bold tracking-wide">TripFlow · สวัสดี</p>
                <h1 className="text-lg font-bold text-gray-900 mt-0.5 leading-tight">{user.name}</h1>
              </div>
            </div>
            <Link href="/profile">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-500 opacity-60 group-hover:opacity-100 blur-sm transition-opacity" />
                <div className="relative p-[2px] rounded-xl bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-500">
                  <div className="w-11 h-11 rounded-[10px] overflow-hidden bg-white flex items-center justify-center">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="" width={44} height={44} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                    ) : (
                      <span className="text-indigo-600 font-bold text-sm">{user.name[0]}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-6 pb-8 max-w-5xl mx-auto w-full page-content">
        {/* Quick stats */}
        <div className="flex gap-3 mb-6">
          {active.length > 0 && (
            <div className="flex-1 bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-emerald-200 relative overflow-hidden">
              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-emerald-400/15 blur-lg" />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">{active.length}</p>
                  <p className="text-[11px] text-emerald-500 font-medium">กำลังเดินทาง</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-indigo-200 relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-indigo-400/15 blur-lg" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
              </div>
              <div>
                <p className="text-2xl font-black text-indigo-600">{upcoming.length}</p>
                <p className="text-[11px] text-gray-500 font-medium">ทริปที่จะมาถึง</p>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-violet-200 relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-violet-400/15 blur-lg" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
              </div>
              <div>
                <p className="text-2xl font-black text-violet-600">{tours.length}</p>
                <p className="text-[11px] text-gray-500 font-medium">ทริปทั้งหมด</p>
              </div>
            </div>
          </div>
        </div>

        {tours.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-indigo-100/40">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            <p className="text-gray-900 font-bold text-lg">ยังไม่มีทริป</p>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">รอรับคำเชิญจากผู้จัดทัวร์ หรือขอให้ admin เพิ่มคุณเข้าทริป</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* กำลังเดินทาง */}
            {active.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <h2 className="font-bold text-emerald-700 text-[15px]">กำลังเดินทาง</h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-200 to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {active.map(tour => <TourCard key={tour.id} tour={tour} variant="active" />)}
                </div>
              </div>
            )}

            {/* ทริปที่จะมาถึง */}
            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1.5 h-5 rounded-full bg-indigo-500" />
                  <h2 className="font-bold text-gray-900 text-[15px]">ทริปที่จะมาถึง</h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-200 via-violet-200 to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcoming.map(tour => <TourCard key={tour.id} tour={tour} variant="upcoming" />)}
                </div>
              </div>
            )}

            {/* ประวัติ */}
            {history.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1.5 h-5 rounded-full bg-gray-300" />
                  <h2 className="font-bold text-gray-500 text-[15px]">ประวัติการเดินทาง</h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map(tour => <TourCard key={tour.id} tour={tour} variant={tour.status === 'CANCELLED' ? 'cancelled' : 'completed'} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TourCard({ tour, variant }: { tour: TourItem; variant: 'active' | 'upcoming' | 'completed' | 'cancelled' }) {
  const countdown = getTripCountdown(new Date(tour.startDate), new Date(tour.endDate))
  const daysCount = tour.days.length
  const isHistory = variant === 'completed' || variant === 'cancelled'

  const borderColor = {
    active: 'border-emerald-200/60 ring-emerald-100 hover:border-emerald-300',
    upcoming: 'border-gray-100/60 ring-transparent hover:border-indigo-200/60 hover:ring-indigo-100',
    completed: 'border-gray-100/40 ring-transparent',
    cancelled: 'border-red-200/40 ring-transparent',
  }[variant]

  return (
    <Link href={`/tour/${tour.id}/today`} className="flex group">
      <div className={`bg-white/50 backdrop-blur-md rounded-2xl border overflow-hidden flex flex-col w-full
        transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ring-1 ${borderColor}
        ${isHistory ? 'opacity-60 hover:opacity-90' : ''}`}>
        <div className={`aspect-[16/9] relative flex-shrink-0 overflow-hidden ${isHistory ? 'bg-gray-100' : 'bg-gradient-to-br from-indigo-100 to-violet-100'}`}>
          {tour.coverImageUrl && (
            <Image src={tour.coverImageUrl} alt="" fill unoptimized
              className={`object-cover absolute inset-0 transition-all duration-500 group-hover:scale-105 ${isHistory ? 'grayscale group-hover:grayscale-0' : ''}`} />
          )}
          {!isHistory && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />}
          <div className="absolute bottom-3 left-3 flex gap-1">
            {tour.countries.map(c => <span key={c} className="text-lg drop-shadow-md">{countryFlags[c] ?? '🌍'}</span>)}
          </div>
          {variant === 'active' && (
            <span className="absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500 text-white font-bold shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />กำลังเดินทาง
            </span>
          )}
          {variant === 'cancelled' && <span className="absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full bg-red-500 text-white font-bold">ยกเลิก</span>}
          {variant === 'completed' && <span className="absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full bg-gray-500 text-white font-bold">เสร็จสิ้น</span>}
          {tour.isChina && <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-red-600 font-semibold border border-white/50">CN</span>}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <p className={`font-semibold text-sm leading-snug line-clamp-2 flex-1 transition-colors ${
            variant === 'cancelled' ? 'text-red-700/70 line-through' : 'text-gray-900 group-hover:text-indigo-600'
          }`}>{tour.title}</p>

          {/* Meal summary */}
          {!isHistory && daysCount > 0 && (() => {
            const b = tour.days.filter(d => d.mealBreakfast).length
            const l = tour.days.filter(d => d.mealLunch).length
            const d = tour.days.filter(d => d.mealDinner).length
            if (b === 0 && l === 0 && d === 0) return null
            return (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {b > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-md font-semibold border border-orange-200/50">เช้า {b} มื้อ</span>}
                {l > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded-md font-semibold border border-green-200/50">กลางวัน {l} มื้อ</span>}
                {d > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-md font-semibold border border-violet-200/50">เย็น {d} มื้อ</span>}
              </div>
            )
          })()}

          <div className="mt-3 pt-3 border-t border-gray-100/60 flex items-center justify-between gap-2">
            <p className="text-gray-500 text-xs truncate flex items-center gap-1">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              {tour.cities.slice(0, 2).join(' · ')} · {daysCount} วัน
            </p>
            <span className={`text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-md ${
              variant === 'active' ? 'text-emerald-700 bg-emerald-50' : variant === 'cancelled' ? 'text-red-500 bg-red-50' : variant === 'completed' ? 'text-gray-400 bg-gray-50' : 'text-indigo-700 bg-indigo-50'
            }`}>{variant === 'cancelled' ? 'ยกเลิกแล้ว' : countdown.label}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
