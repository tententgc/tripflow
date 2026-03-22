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
  isChina: boolean; status: string; days: { id: string }[]; _count: { members: number }
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20">
      {/* Header */}
      <div className="relative">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
        <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 pt-safe-top">
          <div className="flex items-center justify-between py-5 max-w-5xl mx-auto">
            <div>
              <p className="text-gray-400 text-xs font-medium">สวัสดี,</p>
              <h1 className="text-xl font-bold text-gray-900 mt-0.5">{user.name}</h1>
            </div>
            <Link href="/profile">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-50 flex items-center justify-center border border-indigo-100">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" width={40} height={40} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                ) : (
                  <span className="text-indigo-600 font-bold text-sm">{user.name[0]}</span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-6 pb-8 max-w-5xl mx-auto w-full">
        {/* Quick stats */}
        <div className="flex gap-3 mb-6">
          {active.length > 0 && (
            <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-emerald-200/60">
              <p className="text-3xl font-black text-emerald-600">{active.length}</p>
              <p className="text-xs text-emerald-500 mt-0.5">กำลังเดินทาง</p>
            </div>
          )}
          <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-indigo-100/60">
            <p className="text-3xl font-black text-indigo-600">{upcoming.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">ทริปที่จะมาถึง</p>
          </div>
          <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-100/60">
            <p className="text-3xl font-black text-gray-900">{tours.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">ทริปทั้งหมด</p>
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
                  <h2 className="font-bold text-gray-400 text-[15px]">ประวัติการเดินทาง</h2>
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
      <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border overflow-hidden flex flex-col w-full
        transition-all duration-200 hover:shadow-md ring-1 ${borderColor}
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
          <div className="mt-3 pt-3 border-t border-gray-100/60 flex items-center justify-between gap-2">
            <p className="text-gray-400 text-xs truncate">{tour.cities.slice(0, 2).join(' · ')} · {daysCount} วัน</p>
            <span className={`text-[11px] font-semibold shrink-0 ${
              variant === 'active' ? 'text-emerald-600' : variant === 'cancelled' ? 'text-red-400' : variant === 'completed' ? 'text-gray-400' : 'text-indigo-600'
            }`}>{variant === 'cancelled' ? 'ยกเลิกแล้ว' : countdown.label}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
