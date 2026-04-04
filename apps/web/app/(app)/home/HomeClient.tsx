'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useApi } from '@/lib/swr'
import { getTripCountdown } from '@tripflow/utils'

/* ── Constants ── */
const FLAGS: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷', IT: '🇮🇹',
  GB: '🇬🇧', DE: '🇩🇪', SG: '🇸🇬', AU: '🇦🇺', US: '🇺🇸', MY: '🇲🇾',
  TW: '🇹🇼', VN: '🇻🇳', HK: '🇭🇰', AE: '🇦🇪', ES: '🇪🇸', CH: '🇨🇭',
  NZ: '🇳🇿', ID: '🇮🇩',
}

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

/* ── Types ── */
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

/* ── Hooks ── */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ── Utilities ── */
function daysNights(start: string, end: string) {
  const d = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 864e5) + 1
  return { days: d, nights: d - 1 }
}

function fmtDate(start: string, end: string) {
  const s = new Date(start), e = new Date(end)
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
    return `${s.getDate()} – ${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${s.getFullYear()}`
}

function greetingText() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/* ── Reveal ── */
function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const { ref, visible } = useInView()
  const reduced = useReducedMotion()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible || reduced ? 1 : 0,
      transform: visible || reduced ? 'none' : 'translateY(14px)',
      transition: reduced ? 'none' : `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════════════ */
export default function HomeClient({ initialData }: { initialData: HomeData }) {
  const { data } = useApi<HomeData>('/api/my-tours', {
    fallbackData: initialData,
    revalidateOnMount: false,
    revalidateOnFocus: true,
  })
  const tours = data?.tours ?? initialData.tours
  const user = data?.user ?? initialData.user

  const active = tours.filter(t => t.status === 'ACTIVE')
  const upcoming = tours.filter(t => t.status === 'PUBLISHED')
  const past = tours.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')

  /* Hero logic — active trip takes priority, then next upcoming with countdown */
  const heroActive = active[0] ?? null
  const nextUpcoming = upcoming[0] ?? null
  const countdown = nextUpcoming
    ? getTripCountdown(new Date(nextUpcoming.startDate), new Date(nextUpcoming.endDate))
    : null
  const daysLeft = countdown?.daysUntilDeparture ?? 0
  const showUpcomingHero = !heroActive && nextUpcoming && daysLeft > 0

  /* Section tours — exclude hero to avoid duplication */
  const otherActive = heroActive ? active.slice(1) : []
  const sectionUpcoming = showUpcomingHero ? upcoming.slice(1) : upcoming
  const totalCountries = new Set(tours.flatMap(t => t.countries)).size

  return (
    <div className="min-h-screen" style={{ background: '#faf8f5' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40" style={{
        background: 'rgba(250,248,245,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium" style={{ color: '#b8a394' }}>
              {greetingText()}
            </p>
            <h1 className="text-[17px] font-bold" style={{ color: '#2c1810', letterSpacing: '-0.02em' }}>
              {user.name}
            </h1>
          </div>
          <Link href="/profile" className="no-btn-fx">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-orange-200 transition-all duration-200">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt="" width={40} height={40}
                  className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold"
                  style={{ background: '#fff4ed', color: '#ea580c' }}>
                  {user.name[0]}
                </div>
              )}
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto pb-32">

        {/* ── Active Trip Hero ── */}
        {heroActive && (
          <Reveal className="px-5 pt-5">
            <ActiveHero tour={heroActive} />
          </Reveal>
        )}

        {/* ── Upcoming Trip Hero ── */}
        {showUpcomingHero && nextUpcoming && (
          <Reveal className="px-5 pt-5">
            <UpcomingHero trip={nextUpcoming} daysLeft={daysLeft} />
          </Reveal>
        )}

        {/* ── Stats ── */}
        {tours.length > 0 && (
          <Reveal delay={80} className="px-5 mt-6 mb-10">
            <p className="text-[13px] font-medium tabular-nums" style={{ color: '#b8a394' }}>
              {(active.length + upcoming.length) > 0 && (
                <>{active.length + upcoming.length} upcoming</>
              )}
              {past.length > 0 && (
                <>{(active.length + upcoming.length) > 0 ? ' · ' : ''}{past.length} completed</>
              )}
              {totalCountries > 0 && (
                <> · {totalCountries} {totalCountries === 1 ? 'country' : 'countries'}</>
              )}
            </p>
          </Reveal>
        )}

        {/* ── Other Active Trips ── */}
        {otherActive.length > 0 && (
          <div className="px-5 mb-10">
            <Reveal><SectionLabel text="Also Travelling" live /></Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {otherActive.map((t, i) => (
                <Reveal key={t.id} delay={i * 50}>
                  <TourCard tour={t} showLive />
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* ── Upcoming Tours ── */}
        {sectionUpcoming.length > 0 && (
          <Reveal delay={100} className="mb-10">
            <div className="px-5 mb-4">
              <SectionLabel text="Upcoming" />
            </div>
            {/* Mobile: horizontal scroll | Desktop: grid */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pl-5 pb-1
              sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:snap-none sm:px-5 sm:pb-0">
              {sectionUpcoming.map((t, i) => (
                <div key={t.id} className="snap-start flex-shrink-0 w-[268px] sm:w-auto">
                  <Reveal delay={i * 60}>
                    <TourCard tour={t} />
                  </Reveal>
                </div>
              ))}
              {/* Right-edge spacer for mobile scroll */}
              <div className="flex-shrink-0 w-1 sm:hidden" aria-hidden="true" />
            </div>
          </Reveal>
        )}

        {/* ── Past Trips ── */}
        {past.length > 0 && (
          <div className="px-5 mb-10">
            <Reveal><SectionLabel text="Memories" dim /></Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
              {past.map((t, i) => (
                <Reveal key={t.id} delay={i * 40}>
                  <CompactCard tour={t} />
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {tours.length === 0 && (
          <Reveal className="px-5 mt-12">
            <div className="rounded-2xl p-12 text-center bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#fff4ed' }}>
                <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <p className="text-[17px] font-bold" style={{ color: '#2c1810' }}>No trips yet</p>
              <p className="text-[13px] mt-2 max-w-[280px] mx-auto leading-relaxed" style={{ color: '#b8a394' }}>
                รอรับคำเชิญจากผู้จัดทัวร์ หรือขอให้ admin เพิ่มคุณเข้าทริป
              </p>
            </div>
          </Reveal>
        )}
      </main>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   ACTIVE TRIP HERO
   Cinematic card with live indicator + trip progress
   ══════════════════════════════════════════════════ */
function ActiveHero({ tour }: { tour: TourItem }) {
  const cd = getTripCountdown(new Date(tour.startDate), new Date(tour.endDate))
  const { days } = daysNights(tour.startDate, tour.endDate)
  const progress = cd.currentDayNumber ? Math.round((cd.currentDayNumber / days) * 100) : 0

  return (
    <Link href={`/tour/${tour.id}/today`} className="block no-btn-fx no-card-fx group">
      <div className="relative rounded-[20px] overflow-hidden"
        style={{ boxShadow: '0 4px 20px rgba(16,185,129,0.1), 0 1px 4px rgba(0,0,0,0.04)' }}>

        {/* Image */}
        <div className="relative h-[220px] sm:h-[260px]">
          {tour.coverImageUrl ? (
            <Image src={tour.coverImageUrl} alt="" fill unoptimized priority
              className="object-cover transition-transform duration-700 group-hover:scale-[1.015]" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }} />
          )}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(44,24,16,0.9) 0%, rgba(44,24,16,0.35) 45%, rgba(0,0,0,0.06) 100%)',
          }} />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-[0.08em]">
              Travelling Now
            </span>
          </div>

          <h2 className="text-[22px] sm:text-[26px] font-bold text-white leading-tight truncate"
            style={{ letterSpacing: '-0.02em' }}>
            {tour.title}
          </h2>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[13px] text-white/50">
              {FLAGS[tour.primaryCountry]} {tour.cities.slice(0, 2).join(', ')}
            </span>
          </div>

          {/* Trip progress */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(progress, 100)}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
            </div>
            <span className="text-[11px] font-semibold text-white/50 tabular-nums flex-shrink-0">
              Day {cd.currentDayNumber} / {days}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ══════════════════════════════════════════════════
   UPCOMING TRIP HERO
   Full-bleed cinematic with countdown
   ══════════════════════════════════════════════════ */
function UpcomingHero({ trip, daysLeft }: { trip: TourItem; daysLeft: number }) {
  return (
    <Link href={`/tour/${trip.id}/today`} className="block no-btn-fx no-card-fx group">
      <div className="relative rounded-[20px] overflow-hidden"
        style={{ boxShadow: '0 4px 24px rgba(234,88,12,0.1), 0 1px 4px rgba(0,0,0,0.04)' }}>

        {/* Image — taller for cinematic effect */}
        <div className="relative h-[240px] sm:h-[300px]">
          {trip.coverImageUrl ? (
            <Image src={trip.coverImageUrl} alt="" fill unoptimized priority
              className="object-cover transition-transform duration-700 group-hover:scale-[1.015]" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }} />
          )}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(44,24,16,0.9) 0%, rgba(44,24,16,0.3) 45%, rgba(0,0,0,0.08) 100%)',
          }} />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <div className="flex items-end justify-between gap-5">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em] mb-2">
                Next Trip
              </p>
              <h2 className="text-[22px] sm:text-[28px] font-bold text-white leading-tight truncate"
                style={{ letterSpacing: '-0.025em' }}>
                {trip.title}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[13px] text-white/45 font-medium">
                  {FLAGS[trip.primaryCountry]} {trip.cities.slice(0, 2).join(', ')}
                </span>
                <span className="text-white/15">·</span>
                <span className="text-[12px] text-white/35">
                  {fmtDate(trip.startDate, trip.endDate)}
                </span>
              </div>
            </div>

            {/* Countdown — the ONE number that matters */}
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="text-[48px] sm:text-[60px] font-black text-white leading-none tabular-nums"
                style={{ letterSpacing: '-0.04em' }}>
                {daysLeft}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 mt-1">
                days to go
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ══════════════════════════════════════════════════
   SECTION LABEL
   ══════════════════════════════════════════════════ */
function SectionLabel({ text, live, dim }: { text: string; live?: boolean; dim?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {live && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-50" />
          <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>
      )}
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: dim ? '#c4b5a5' : '#a0785c' }}>
        {text}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.04)' }} />
    </div>
  )
}

/* ══════════════════════════════════════════════════
   TOUR CARD
   Image-forward, clean info below
   ══════════════════════════════════════════════════ */
function TourCard({ tour, showLive }: { tour: TourItem; showLive?: boolean }) {
  const cd = getTripCountdown(new Date(tour.startDate), new Date(tour.endDate))
  const { days, nights } = daysNights(tour.startDate, tour.endDate)
  const b = tour.days.filter(d => d.mealBreakfast).length
  const l = tour.days.filter(d => d.mealLunch).length
  const dinner = tour.days.filter(d => d.mealDinner).length

  return (
    <Link href={`/tour/${tour.id}/today`} className="block no-btn-fx no-card-fx group h-full">
      <div className="rounded-2xl overflow-hidden bg-white h-full flex flex-col transition-shadow duration-300 group-hover:shadow-lg"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.03)' }}>

        {/* Image */}
        <div className="relative h-[190px] overflow-hidden flex-shrink-0">
          {tour.coverImageUrl ? (
            <Image src={tour.coverImageUrl} alt="" fill unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #fed7aa, #fdba74)' }} />
          )}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(44,24,16,0.7) 0%, rgba(0,0,0,0.06) 50%, transparent 100%)',
          }} />

          {/* Country pill */}
          <div className="absolute top-3 right-3">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.9)', color: '#78350f' }}>
              {FLAGS[tour.primaryCountry]} {tour.primaryCountry}
            </span>
          </div>

          {/* Status badge */}
          {showLive && cd.currentDayNumber ? (
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white"
              style={{ background: '#10b981' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-50" />
                <span className="relative rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              Day {cd.currentDayNumber}
            </div>
          ) : cd.daysUntilDeparture !== undefined && cd.daysUntilDeparture > 0 ? (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white"
              style={{ background: 'rgba(249,115,22,0.85)', backdropFilter: 'blur(4px)' }}>
              {cd.daysUntilDeparture} วัน
            </div>
          ) : null}

          {/* Title on image */}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-white font-bold text-[15px] leading-snug line-clamp-2"
              style={{ letterSpacing: '-0.01em', textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
              {tour.title}
            </h3>
          </div>
        </div>

        {/* Info */}
        <div className="px-4 py-3.5 flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[12px] min-w-0" style={{ color: '#7c5a3e' }}>
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
              </svg>
              <span className="truncate">{tour.cities.slice(0, 3).join(', ')}</span>
            </div>
            <span className="text-[12px] font-semibold flex-shrink-0 tabular-nums" style={{ color: '#9a7b5e' }}>
              {days}D{nights}N
            </span>
          </div>

          <div className="text-[12px] font-medium" style={{ color: '#9a7b5e' }}>
            {fmtDate(tour.startDate, tour.endDate)}
          </div>

          {/* Meals + meta */}
          <div className="flex items-center justify-between mt-auto pt-2.5" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-1">
              {b > 0 && <MealTag emoji="🌅" count={b} />}
              {l > 0 && <MealTag emoji="🍱" count={l} />}
              {dinner > 0 && <MealTag emoji="🌙" count={dinner} />}
            </div>
            <div className="flex items-center gap-2">
              {tour.isChina && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: '#fef2f2', color: '#dc2626' }}>CN</span>
              )}
              <span className="text-[11px] font-medium" style={{ color: '#9a7b5e' }}>
                {tour._count?.members ?? 0} pax
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ══════════════════════════════════════════════════
   MEAL TAG
   ══════════════════════════════════════════════════ */
function MealTag({ emoji, count }: { emoji: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 h-[22px] px-2 rounded-full text-[11px] font-semibold"
      style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
      <span className="text-[10px]">{emoji}</span>{count}
    </span>
  )
}

/* ══════════════════════════════════════════════════
   COMPACT CARD — past trips
   ══════════════════════════════════════════════════ */
function CompactCard({ tour }: { tour: TourItem }) {
  const cancelled = tour.status === 'CANCELLED'
  const { days, nights } = daysNights(tour.startDate, tour.endDate)

  return (
    <Link href={`/tour/${tour.id}/today`} className="block no-btn-fx no-card-fx group h-full">
      <div className="rounded-xl overflow-hidden bg-white h-full flex flex-col transition-shadow duration-300 group-hover:shadow-md"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div className="relative h-[120px] sm:h-[130px] overflow-hidden flex-shrink-0">
          {tour.coverImageUrl ? (
            <Image src={tour.coverImageUrl} alt="" fill unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ filter: cancelled ? 'grayscale(60%) brightness(0.9)' : 'none' }} />
          ) : (
            <div className="w-full h-full" style={{ background: '#fed7aa' }} />
          )}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(44,24,16,0.65) 0%, transparent 50%)',
          }} />
          {cancelled && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500 text-white">
              ยกเลิก
            </div>
          )}
          <div className="absolute bottom-2 left-2.5 right-2.5">
            <p className="text-white font-semibold text-[13px] leading-tight line-clamp-2"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              {tour.title}
            </p>
          </div>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[11px] truncate" style={{ color: '#7c5a3e' }}>
            {FLAGS[tour.primaryCountry]} {tour.cities.slice(0, 2).join(', ')}
          </p>
          <p className="text-[10px] mt-0.5 tabular-nums font-medium" style={{ color: '#9a7b5e' }}>
            {days} วัน {nights} คืน
          </p>
        </div>
      </div>
    </Link>
  )
}
