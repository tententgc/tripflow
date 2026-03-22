'use client'

import { useState, useEffect, useRef } from 'react'
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

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.60)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 24px rgba(100,80,180,0.07)',
  borderRadius: '20px',
}

function useCountUp(target: number, dur = 1000) {
  const [v, setV] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    if (target <= 0) { setV(0); return }
    const from = ref.current; ref.current = target
    const t0 = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setV(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, dur])
  return v
}

export default function HomeClient({ initialData }: Props) {
  const { data } = useApi<HomeData>('/api/my-tours', {
    fallbackData: initialData,
  })

  const tours = data?.tours ?? initialData.tours
  const user = data?.user ?? initialData.user

  const active = tours.filter(t => t.status === 'ACTIVE')
  const upcoming = tours.filter(t => t.status === 'PUBLISHED')
  const history = tours.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')

  // Next departure
  const nextTrip = [...active, ...upcoming][0] ?? null
  const nextCountdown = nextTrip ? getTripCountdown(new Date(nextTrip.startDate), new Date(nextTrip.endDate)) : null
  const daysUntilDeparture = nextCountdown?.daysUntilDeparture ?? 0
  const animatedDays = useCountUp(daysUntilDeparture > 0 ? daysUntilDeparture : 0)

  return (
    <div className="min-h-screen bg-[#f0f1f8] relative overflow-hidden">
      <style>{`
        @keyframes float1 { from { transform: translate(0,0) } to { transform: translate(30px, 40px) } }
        @keyframes float2 { from { transform: translate(0,0) } to { transform: translate(-20px, 30px) } }
        @keyframes float3 { from { transform: translateX(-50%) translateY(0) } to { transform: translateX(-50%) translateY(-20px) } }
        @keyframes homeSlideRight { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes homeCardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Ambient blobs — scaled down on mobile */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full w-[360px] h-[360px] min-[900px]:w-[600px] min-[900px]:h-[600px]" style={{ top: -100, left: -100, background: 'radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)', animation: 'float1 18s ease-in-out infinite alternate' }} />
        <div className="absolute rounded-full w-[300px] h-[300px] min-[900px]:w-[500px] min-[900px]:h-[500px]" style={{ top: 0, right: -80, background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', animation: 'float2 22s ease-in-out infinite alternate' }} />
        <div className="absolute rounded-full w-[420px] h-[240px] min-[900px]:w-[700px] min-[900px]:h-[400px]" style={{ bottom: 100, left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(167,139,250,0.1), transparent 70%)', animation: 'float3 26s ease-in-out infinite alternate' }} />
      </div>

      {/* Header */}
      <div className="relative" style={{ zIndex: 2 }}>
        <div className="px-4 min-[900px]:px-5 pt-safe-top" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between py-3 min-[900px]:py-4 max-w-[1080px] mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-9 min-[900px]:w-10 h-9 min-[900px]:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7c5cfc, #6366f1)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f8f8fc" strokeWidth="1.5" opacity="0.4"/><path d="M5 17L10 12L5 10L18 6L14 19L12 14L5 17Z" fill="#f8f8fc" fillOpacity="0.95"/></svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold" style={{ color: 'rgba(30,30,60,0.4)' }}>สวัสดี</p>
                <h1 className="text-[15px] min-[900px]:text-[17px] font-extrabold text-[#1a1a2e] leading-tight mt-0.5">{user.name}</h1>
              </div>
            </div>
            <Link href="/profile" className="no-btn-fx">
              <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 10px rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.5)' }}>
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" width={44} height={44} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                ) : (
                  <span className="text-[#7c5cfc] font-bold text-sm">{user.name[0]}</span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-4 min-[900px]:px-6 max-w-[1080px] mx-auto" style={{ zIndex: 1, paddingTop: '24px', paddingBottom: '100px' }}>
        <div className="min-[900px]:grid min-[900px]:gap-6" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>

          {/* ═══ LEFT COLUMN ═══ */}
          {/* MOBILE: compact combined card */}
          <div className="min-[900px]:hidden flex flex-col gap-4 mb-4" style={{ animation: 'homeSlideRight 0.4s ease-out both' }}>
            {/* User + stats combined */}
            <div className="rounded-[20px] flex items-center gap-3.5" style={{ ...glass, padding: '16px 20px' }}>
              <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)' }}>
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" width={44} height={44} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                ) : (
                  <span className="text-[#7c5cfc] font-bold text-sm">{user.name[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-extrabold text-[#1a1a2e] truncate">{user.name}</p>
                <span className="inline-flex items-center gap-1 h-5 px-2 rounded-[20px] text-[10px] font-bold mt-1" style={{ background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', color: '#7c5cfc' }}>
                  ✈ TripFlow
                </span>
              </div>
              <div className="flex items-center gap-0 flex-shrink-0">
                <div className="text-center px-3">
                  <p className="text-[20px] font-extrabold text-[#1a1a2e]">{upcoming.length + active.length}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(30,30,60,0.4)' }}>จะมาถึง</p>
                </div>
                <div style={{ width: '0.5px', height: '28px', background: 'rgba(0,0,0,0.08)' }} />
                <div className="text-center px-3">
                  <p className="text-[20px] font-extrabold text-[#1a1a2e]">{history.length}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(30,30,60,0.4)' }}>ผ่านมา</p>
                </div>
              </div>
            </div>

            {/* Next departure — horizontal on mobile */}
            {nextTrip && daysUntilDeparture > 0 && (
              <div className="rounded-[20px] relative overflow-hidden" style={glass}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px]" style={{ background: 'linear-gradient(to bottom, #7c5cfc, #a78bfa)' }} />
                <div className="flex items-center justify-between gap-3" style={{ padding: '14px 18px 14px 22px' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase" style={{ color: 'rgba(30,30,60,0.4)', letterSpacing: '0.09em' }}>ออกเดินทางครั้งต่อไป</p>
                    <p className="text-[13px] font-bold text-[#1a1a2e] mt-1 truncate">{nextTrip.title}</p>
                  </div>
                  <div className="flex items-end gap-1 flex-shrink-0">
                    <span className="text-[28px] font-extrabold text-[#7c5cfc]" style={{ letterSpacing: '-0.02em', lineHeight: '1', textShadow: '0 0 20px rgba(124,92,252,0.25)' }}>
                      {animatedDays}
                    </span>
                    <span className="text-[11px] pb-0.5" style={{ color: 'rgba(30,30,60,0.35)' }}>วัน</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DESKTOP: full left column */}
          <div className="hidden min-[900px]:flex min-[900px]:sticky min-[900px]:top-[80px] flex-col gap-3.5" style={{ animation: 'homeSlideRight 0.4s ease-out both' }}>
            {/* Profile card */}
            <div className="rounded-[20px] p-5" style={glass}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)' }}>
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt="" width={48} height={48} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                  ) : (
                    <span className="text-[#7c5cfc] font-bold">{user.name[0]}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[16px] font-extrabold text-[#1a1a2e] truncate">{user.name}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[20px] text-[11px] font-bold" style={{ background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', color: '#7c5cfc' }}>
                ✈ TripFlow
              </span>
            </div>

            {/* Stats */}
            <div className="rounded-[20px] p-4 flex items-center gap-3.5" style={glass}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,92,252,0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
              </div>
              <div>
                <p className="text-[28px] font-extrabold text-[#1a1a2e]" style={{ letterSpacing: '-0.02em' }}>{upcoming.length + active.length}</p>
                <p className="text-[12px]" style={{ color: 'rgba(30,30,60,0.4)' }}>ทริปที่จะมาถึง</p>
              </div>
            </div>

            <div className="rounded-[20px] p-4 flex items-center gap-3.5" style={glass}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <svg className="w-5 h-5" style={{ color: '#3b82f6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
              </div>
              <div>
                <p className="text-[28px] font-extrabold text-[#1a1a2e]" style={{ letterSpacing: '-0.02em' }}>{history.length}</p>
                <p className="text-[12px]" style={{ color: 'rgba(30,30,60,0.4)' }}>ทริปที่ผ่านมา</p>
              </div>
            </div>

            {/* Next departure */}
            {nextTrip && daysUntilDeparture > 0 && (
              <div className="rounded-[20px] relative overflow-hidden" style={glass}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px]" style={{ background: 'linear-gradient(to bottom, #7c5cfc, #a78bfa)' }} />
                <div className="p-5 pl-6">
                  <p className="text-[10px] font-bold uppercase" style={{ color: 'rgba(30,30,60,0.4)', letterSpacing: '0.09em' }}>ออกเดินทางครั้งต่อไป</p>
                  <p className="text-[14px] font-bold text-[#1a1a2e] mt-1 line-clamp-2">{nextTrip.title}</p>
                  <div className="mt-3 flex items-end gap-1.5">
                    <span className="text-[32px] font-extrabold text-[#7c5cfc]" style={{ letterSpacing: '-0.02em', lineHeight: '1', textShadow: '0 0 20px rgba(124,92,252,0.25)' }}>
                      {animatedDays}
                    </span>
                    <span className="text-[12px] pb-1" style={{ color: 'rgba(30,30,60,0.35)' }}>วันข้างหน้า</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div className="flex flex-col gap-5">
            {tours.length === 0 ? (
              <div className="rounded-[20px] p-12 text-center" style={glass}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.15)' }}>
                  <svg className="w-8 h-8 text-[#7c5cfc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
                </div>
                <p className="text-[#1a1a2e] font-bold text-lg">ยังไม่มีทริป</p>
                <p className="text-sm mt-2 max-w-xs mx-auto" style={{ color: 'rgba(30,30,60,0.4)' }}>รอรับคำเชิญจากผู้จัดทัวร์ หรือขอให้ admin เพิ่มคุณเข้าทริป</p>
              </div>
            ) : (
              <>
                {/* Active */}
                {active.length > 0 && (
                  <TripSection title="กำลังเดินทาง" accentColor="#10b981" tours={active} variant="active" />
                )}

                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <TripSection title="ทริปที่จะมาถึง" accentGradient tours={upcoming} variant="upcoming" />
                )}

                {/* History */}
                {history.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-[3px] h-[18px] rounded-full" style={{ background: 'rgba(30,30,60,0.2)' }} />
                      <h2 className="text-[16px] font-extrabold" style={{ color: 'rgba(30,30,60,0.4)' }}>ประวัติการเดินทาง</h2>
                    </div>
                    <div className="grid grid-cols-2 min-[900px]:grid-cols-3 gap-2.5">
                      {history.map((tour, i) => (
                        <HistoryCard key={tour.id} tour={tour} index={i} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Section with trip cards ──
function TripSection({ title, accentColor, accentGradient, tours, variant }: {
  title: string; accentColor?: string; accentGradient?: boolean
  tours: TourItem[]; variant: 'active' | 'upcoming'
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-[3px] h-[18px] rounded-full" style={{ background: accentGradient ? 'linear-gradient(to bottom, #7c5cfc, #4fc3f7)' : accentColor }} />
        <h2 className="text-[16px] font-extrabold" style={{ color: accentColor ?? '#1a1a2e' }}>{title}</h2>
      </div>
      <div className="grid grid-cols-1 min-[640px]:grid-cols-2 gap-3">
        {tours.map((tour, i) => (
          <TripCard key={tour.id} tour={tour} variant={variant} index={i} />
        ))}
      </div>
    </div>
  )
}

// ── Trip card ──
function TripCard({ tour, variant, index }: { tour: TourItem; variant: 'active' | 'upcoming'; index: number }) {
  const countdown = getTripCountdown(new Date(tour.startDate), new Date(tour.endDate))
  const daysCount = tour.days.length
  const b = tour.days.filter(d => d.mealBreakfast).length
  const l = tour.days.filter(d => d.mealLunch).length
  const d = tour.days.filter(d => d.mealDinner).length

  return (
    <Link href={`/tour/${tour.id}/today`} className="block no-btn-fx group" style={{ animation: `homeCardIn 0.35s ease-out ${index * 0.06}s both` }}>
      <div className="rounded-[20px] overflow-hidden transition-all duration-250 group-hover:-translate-y-1 group-hover:shadow-[0_12px_36px_rgba(100,80,180,0.14)]" style={glass}>
        {/* Image */}
        <div className="relative overflow-hidden h-[180px] min-[900px]:h-[200px]">
          {tour.coverImageUrl ? (
            <Image src={tour.coverImageUrl} alt="" fill unoptimized className="object-cover transition-transform duration-400 group-hover:scale-[1.03]" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.15), rgba(99,102,241,0.1))' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,6,20,0.75) 0%, transparent 55%)' }} />

          {/* Country pill */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-[20px] text-[11px] font-bold" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: '#f8f8fc' }}>
            {tour.countries.map(c => countryFlags[c] ?? '').join('')} {tour.primaryCountry}
          </div>

          {/* Active badge */}
          {variant === 'active' && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-[20px] text-[10px] font-bold" style={{ background: 'rgba(16,185,129,0.85)', backdropFilter: 'blur(8px)', color: '#f8f8fc' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f8f8fc] animate-pulse" />กำลังเดินทาง
            </div>
          )}

          {/* Trip name ON image */}
          <p className="absolute bottom-10 left-3.5 right-12 text-[14px] min-[900px]:text-[15px] font-extrabold line-clamp-2 leading-snug" style={{ color: '#f8f8fc', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            {tour.title}
          </p>

          {/* Countdown pill */}
          {countdown.daysUntilDeparture !== undefined && countdown.daysUntilDeparture > 0 && (
            <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-[20px] text-[11px] font-bold" style={{ background: 'rgba(124,92,252,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#f8f8fc' }}>
              {countdown.daysUntilDeparture} วัน
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 14px 14px' }}>
          {(b > 0 || l > 0 || d > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {b > 0 && <span className="inline-flex items-center h-[22px] px-2 rounded-[20px] text-[10px] font-semibold" style={{ background: 'rgba(251,191,36,0.12)', color: 'rgba(180,130,10,0.9)', border: '1px solid rgba(251,191,36,0.2)' }}>🌅 เช้า {b}</span>}
              {l > 0 && <span className="inline-flex items-center h-[22px] px-2 rounded-[20px] text-[10px] font-semibold" style={{ background: 'rgba(34,197,94,0.1)', color: 'rgba(22,140,65,0.9)', border: '1px solid rgba(34,197,94,0.18)' }}>🍱 กลางวัน {l}</span>}
              {d > 0 && <span className="inline-flex items-center h-[22px] px-2 rounded-[20px] text-[10px] font-semibold" style={{ background: 'rgba(124,92,252,0.1)', color: 'rgba(100,70,210,0.9)', border: '1px solid rgba(124,92,252,0.18)' }}>🌙 เย็น {d}</span>}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-2 text-[12px]" style={{ color: 'rgba(30,30,60,0.4)' }}>
            <span>📍</span>
            <span className="truncate">{tour.cities.slice(0, 2).join(' · ')}</span>
            <span style={{ color: 'rgba(0,0,0,0.15)' }}>·</span>
            <span className="flex-shrink-0">{daysCount} วัน</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── History card ──
function HistoryCard({ tour, index }: { tour: TourItem; index: number }) {
  const countdown = getTripCountdown(new Date(tour.startDate), new Date(tour.endDate))
  const cancelled = tour.status === 'CANCELLED'

  return (
    <Link href={`/tour/${tour.id}/today`} className="block no-btn-fx group" style={{ animation: `homeCardIn 0.35s ease-out ${(index + 6) * 0.06}s both` }}>
      <div className="rounded-[20px] overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_rgba(100,80,180,0.1)]" style={glass}>
        <div className="relative overflow-hidden h-[110px] min-[900px]:h-[140px]">
          {tour.coverImageUrl ? (
            <Image src={tour.coverImageUrl} alt="" fill unoptimized className="object-cover" style={{ filter: 'saturate(30%) brightness(0.85)' }} />
          ) : (
            <div className="w-full h-full" style={{ background: 'rgba(0,0,0,0.04)' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,6,20,0.6) 0%, transparent 50%)' }} />

          {cancelled && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-[10px] text-[10px] font-bold" style={{ background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(6px)', color: '#f8f8fc' }}>
              ยกเลิก
            </div>
          )}

          <p className="absolute bottom-2 left-2.5 right-2.5 text-[13px] font-bold truncate" style={{ color: '#f8f8fc', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
            {tour.title}
          </p>
        </div>

        <div style={{ padding: '8px 10px 10px' }}>
          <p className="text-[11px] truncate" style={{ color: 'rgba(30,30,60,0.35)' }}>
            {tour.cities.slice(0, 2).join(' · ')} · {tour.days.length} วัน
          </p>
          {cancelled && <p className="text-[11px] font-semibold text-[#ef4444] mt-0.5">ยกเลิกแล้ว</p>}
        </div>
      </div>
    </Link>
  )
}
