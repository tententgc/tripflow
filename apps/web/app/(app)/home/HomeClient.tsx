'use client'

import { useState, useEffect, useRef, useMemo, memo } from 'react'
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
   MAIN — Bento Grid Home
   ══════════════════════════════════════════════════ */
export default function HomeClient({ initialData }: { initialData: HomeData }) {
  const { data } = useApi<HomeData>('/api/my-tours', {
    fallbackData: initialData,
    revalidateOnMount: false,
    revalidateOnFocus: true,
  })
  const tours = data?.tours ?? initialData.tours
  const user = data?.user ?? initialData.user

  const { active, upcoming, past, totalCountries } = useMemo(() => {
    const a: TourItem[] = [], u: TourItem[] = [], p: TourItem[] = []
    const countries = new Set<string>()
    for (const t of tours) {
      if (t.status === 'ACTIVE') a.push(t)
      else if (t.status === 'PUBLISHED') u.push(t)
      else if (t.status === 'COMPLETED' || t.status === 'CANCELLED') p.push(t)
      for (const c of t.countries) countries.add(c)
    }
    return { active: a, upcoming: u, past: p, totalCountries: countries.size }
  }, [tours])

  const { heroActive, nextUpcoming, daysLeft, showUpcomingHero, otherActive, sectionUpcoming } = useMemo(() => {
    const ha = active[0] ?? null
    const nu = upcoming[0] ?? null
    const cd = nu ? getTripCountdown(new Date(nu.startDate), new Date(nu.endDate)) : null
    const dl = cd?.daysUntilDeparture ?? 0
    const showHero = !ha && nu && dl > 0
    return {
      heroActive: ha,
      nextUpcoming: nu,
      daysLeft: dl,
      showUpcomingHero: showHero,
      otherActive: ha ? active.slice(1) : [],
      sectionUpcoming: showHero ? upcoming.slice(1) : upcoming,
    }
  }, [active, upcoming])

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/50"
        style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400">
              {greetingText()}
            </p>
            <h1 className="text-[17px] font-bold text-slate-800" style={{ letterSpacing: '-0.02em' }}>
              {user.name}
            </h1>
          </div>
          <Link href="/profile" className="no-btn-fx">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-primary-200 transition-all duration-200">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt="" width={40} height={40} priority
                  className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-primary-50 text-primary-600">
                  {user.name[0]}
                </div>
              )}
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto pb-32">

        {/* ── Stats Row — bento mini widgets ── */}
        {tours.length > 0 && (
          <Reveal delay={40} className="px-5 pt-5">
            <div className="grid grid-cols-3 gap-3">
              <StatWidget
                value={active.length + upcoming.length}
                label="upcoming"
                accent="#4f46e5"
                bg="#eef2ff"
              />
              <StatWidget
                value={past.length}
                label="completed"
                accent="#10b981"
                bg="#ecfdf5"
              />
              <StatWidget
                value={totalCountries}
                label={totalCountries === 1 ? 'country' : 'countries'}
                accent="#f97066"
                bg="#fff1f0"
              />
            </div>
          </Reveal>
        )}

        {/* ── Active Trip — Hero Bento Widget ── */}
        {heroActive && (
          <Reveal className="px-5 pt-4">
            <ActiveHero tour={heroActive} />
          </Reveal>
        )}

        {/* ── Upcoming Trip — Countdown Hero ── */}
        {showUpcomingHero && nextUpcoming && (
          <Reveal className="px-5 pt-4">
            <UpcomingHero trip={nextUpcoming} daysLeft={daysLeft} />
          </Reveal>
        )}

        {/* ── Other Active Trips ── */}
        {otherActive.length > 0 && (
          <div className="px-5 mt-8">
            <Reveal><SectionLabel text="Also Travelling" live /></Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {otherActive.map((t, i) => (
                <Reveal key={t.id} delay={i * 50}>
                  <TourCard tour={t} showLive />
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* ── Upcoming Tours — Bento Grid ── */}
        {sectionUpcoming.length > 0 && (
          <Reveal delay={100} className="mt-8">
            <div className="px-5 mb-3">
              <SectionLabel text="Upcoming" />
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pl-5 pb-1
              sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:snap-none sm:px-5 sm:pb-0">
              {sectionUpcoming.map((t, i) => (
                <div key={t.id} className="snap-start flex-shrink-0 w-[268px] sm:w-auto">
                  <Reveal delay={i * 60}>
                    <TourCard tour={t} />
                  </Reveal>
                </div>
              ))}
              <div className="flex-shrink-0 w-1 sm:hidden" aria-hidden="true" />
            </div>
          </Reveal>
        )}

        {/* ── Past Trips — Compact Bento ── */}
        {past.length > 0 && (
          <div className="px-5 mt-8">
            <Reveal><SectionLabel text="Memories" dim /></Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
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
            <div className="rounded-3xl p-12 text-center bg-white border border-slate-200"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-primary-50">
                <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <p className="text-[17px] font-bold text-slate-800">No trips yet</p>
              <p className="text-[13px] mt-2 max-w-[280px] mx-auto leading-relaxed text-slate-400">
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
   STAT WIDGET — mini bento card
   ══════════════════════════════════════════════════ */
function StatWidget({ value, label, accent, bg }: {
  value: number; label: string; accent: string; bg: string
}) {
  return (
    <div className="rounded-2xl p-4 border border-slate-100"
      style={{ background: bg }}>
      <p className="text-[28px] font-extrabold tabular-nums leading-none"
        style={{ color: accent, letterSpacing: '-0.03em' }}>
        {value}
      </p>
      <p className="text-[12px] font-medium mt-1.5 text-slate-500">{label}</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   ACTIVE TRIP HERO — Bento widget with progress
   ══════════════════════════════════════════════════ */
function ActiveHero({ tour }: { tour: TourItem }) {
  const cd = getTripCountdown(new Date(tour.startDate), new Date(tour.endDate))
  const { days } = daysNights(tour.startDate, tour.endDate)
  const progress = cd.currentDayNumber ? Math.round((cd.currentDayNumber / days) * 100) : 0

  return (
    <Link href={`/tour/${tour.id}/today`} className="block no-btn-fx no-card-fx group">
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/60"
        style={{ boxShadow: '0 4px 20px rgba(79,70,229,0.08), 0 1px 4px rgba(0,0,0,0.04)' }}>

        <div className="relative h-[220px] sm:h-[260px]">
          {tour.coverImageUrl ? (
            <Image src={tour.coverImageUrl} alt="" fill unoptimized priority
              className="object-cover transition-transform duration-700 group-hover:scale-[1.015]" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-600 to-violet-600" />
          )}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.3) 45%, rgba(0,0,0,0.06) 100%)' }} />
        </div>

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

          {/* Trip progress — indigo bar */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/10">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(progress, 100)}%`, background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
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
   UPCOMING TRIP HERO — Countdown bento
   ══════════════════════════════════════════════════ */
function UpcomingHero({ trip, daysLeft }: { trip: TourItem; daysLeft: number }) {
  return (
    <Link href={`/tour/${trip.id}/today`} className="block no-btn-fx no-card-fx group">
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/60"
        style={{ boxShadow: '0 4px 24px rgba(79,70,229,0.08), 0 1px 4px rgba(0,0,0,0.04)' }}>

        <div className="relative h-[240px] sm:h-[300px]">
          {trip.coverImageUrl ? (
            <Image src={trip.coverImageUrl} alt="" fill unoptimized priority
              className="object-cover transition-transform duration-700 group-hover:scale-[1.015]" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-600 to-violet-600" />
          )}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.25) 45%, rgba(0,0,0,0.08) 100%)' }} />
        </div>

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

            {/* Countdown */}
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="text-[48px] sm:text-[60px] font-black text-white leading-none tabular-nums"
                style={{ letterSpacing: '-0.04em' }}>
                {daysLeft}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary-300/60 mt-1">
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
      <h2 className={`text-[13px] font-semibold uppercase tracking-[0.08em] ${dim ? 'text-slate-300' : 'text-slate-500'}`}>
        {text}
      </h2>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}

/* ══════════════════════════════════════════════════
   TOUR CARD — Bento widget style
   ══════════════════════════════════════════════════ */
const TourCard = memo(function TourCard({ tour, showLive }: { tour: TourItem; showLive?: boolean }) {
  const cd = useMemo(() => getTripCountdown(new Date(tour.startDate), new Date(tour.endDate)), [tour.startDate, tour.endDate])
  const { days, nights } = useMemo(() => daysNights(tour.startDate, tour.endDate), [tour.startDate, tour.endDate])
  const { b, l, dinner } = useMemo(() => {
    let b = 0, l = 0, d = 0
    for (const day of tour.days) { if (day.mealBreakfast) b++; if (day.mealLunch) l++; if (day.mealDinner) d++ }
    return { b, l, dinner: d }
  }, [tour.days])

  return (
    <Link href={`/tour/${tour.id}/today`} className="block no-btn-fx no-card-fx group h-full">
      <div className="rounded-2xl overflow-hidden bg-white h-full flex flex-col transition-shadow duration-300 group-hover:shadow-lg border border-slate-200/60"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.03)' }}>

        <div className="relative h-[190px] overflow-hidden flex-shrink-0">
          {tour.coverImageUrl ? (
            <Image src={tour.coverImageUrl} alt="" fill unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-100" />
          )}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.7) 0%, rgba(0,0,0,0.06) 50%, transparent 100%)' }} />

          {/* Country pill */}
          <div className="absolute top-3 right-3">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/90 text-slate-700">
              {FLAGS[tour.primaryCountry]} {tour.primaryCountry}
            </span>
          </div>

          {/* Status badge */}
          {showLive && cd.currentDayNumber ? (
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-emerald-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-50" />
                <span className="relative rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              Day {cd.currentDayNumber}
            </div>
          ) : cd.daysUntilDeparture !== undefined && cd.daysUntilDeparture > 0 ? (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-primary-600/85 backdrop-blur-sm">
              {cd.daysUntilDeparture} วัน
            </div>
          ) : null}

          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-white font-bold text-[15px] leading-snug line-clamp-2"
              style={{ letterSpacing: '-0.01em', textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
              {tour.title}
            </h3>
          </div>
        </div>

        <div className="px-4 py-3.5 flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[12px] min-w-0 text-slate-500">
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
              </svg>
              <span className="truncate">{tour.cities.slice(0, 3).join(', ')}</span>
            </div>
            <span className="text-[12px] font-semibold flex-shrink-0 tabular-nums text-slate-400">
              {days}D{nights}N
            </span>
          </div>

          <div className="text-[12px] font-medium text-slate-400">
            {fmtDate(tour.startDate, tour.endDate)}
          </div>

          <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-1">
              {b > 0 && <MealTag emoji="🌅" count={b} />}
              {l > 0 && <MealTag emoji="🍱" count={l} />}
              {dinner > 0 && <MealTag emoji="🌙" count={dinner} />}
            </div>
            <div className="flex items-center gap-2">
              {tour.isChina && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-500">CN</span>
              )}
              <span className="text-[11px] font-medium text-slate-400">
                {tour._count?.members ?? 0} pax
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
})

/* ══════════════════════════════════════════════════
   MEAL TAG
   ══════════════════════════════════════════════════ */
function MealTag({ emoji, count }: { emoji: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 h-[22px] px-2 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-100">
      <span className="text-[10px]">{emoji}</span>{count}
    </span>
  )
}

/* ══════════════════════════════════════════════════
   COMPACT CARD — past trips
   ══════════════════════════════════════════════════ */
const CompactCard = memo(function CompactCard({ tour }: { tour: TourItem }) {
  const cancelled = tour.status === 'CANCELLED'
  const { days, nights } = useMemo(() => daysNights(tour.startDate, tour.endDate), [tour.startDate, tour.endDate])

  return (
    <Link href={`/tour/${tour.id}/today`} className="block no-btn-fx no-card-fx group h-full">
      <div className="rounded-xl overflow-hidden bg-white h-full flex flex-col transition-shadow duration-300 group-hover:shadow-md border border-slate-200/60"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div className="relative h-[120px] sm:h-[130px] overflow-hidden flex-shrink-0">
          {tour.coverImageUrl ? (
            <Image src={tour.coverImageUrl} alt="" fill unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ filter: cancelled ? 'grayscale(60%) brightness(0.9)' : 'none' }} />
          ) : (
            <div className="w-full h-full bg-slate-200" />
          )}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.65) 0%, transparent 50%)' }} />
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
          <p className="text-[11px] truncate text-slate-500">
            {FLAGS[tour.primaryCountry]} {tour.cities.slice(0, 2).join(', ')}
          </p>
          <p className="text-[10px] mt-0.5 tabular-nums font-medium text-slate-400">
            {days} วัน {nights} คืน
          </p>
        </div>
      </div>
    </Link>
  )
})
