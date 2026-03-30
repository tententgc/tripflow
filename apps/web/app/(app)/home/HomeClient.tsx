'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useApi } from '@/lib/swr'
import { getTripCountdown } from '@tripflow/utils'

/* ═══ Constants ═══ */
const FLAGS: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷', IT: '🇮🇹',
  GB: '🇬🇧', DE: '🇩🇪', SG: '🇸🇬', AU: '🇦🇺', US: '🇺🇸', MY: '🇲🇾',
  TW: '🇹🇼', VN: '🇻🇳', HK: '🇭🇰', AE: '🇦🇪', ES: '🇪🇸', CH: '🇨🇭',
  NZ: '🇳🇿', ID: '🇮🇩',
}

/* ═══ Types ═══ */
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

/* ═══ Spring Physics ═══ */
type SpringCfg = { stiffness: number; damping: number; mass: number }
const SP = {
  gentle: { stiffness: 120, damping: 14, mass: 1 },
  snappy: { stiffness: 300, damping: 20, mass: 0.8 },
} as const

function useReducedMotion() {
  const [r, setR] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setR(mq.matches)
    const h = (e: MediaQueryListEvent) => setR(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return r
}

function useSpring(target: number, cfg: SpringCfg = SP.gentle) {
  const ref = useRef({ value: target, velocity: 0 })
  const [value, setValue] = useState(target)
  const raf = useRef(0)
  const rm = useReducedMotion()
  useEffect(() => {
    if (rm) { setValue(target); return }
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.064)
      last = now
      const s = ref.current
      const f = -cfg.stiffness * (s.value - target) - cfg.damping * s.velocity
      s.velocity += (f / cfg.mass) * dt
      s.value += s.velocity * dt
      if (Math.abs(s.value - target) < 0.01 && Math.abs(s.velocity) < 0.01) {
        s.value = target; s.velocity = 0; setValue(target); return
      }
      setValue(s.value)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, cfg, rm])
  return value
}

/* ═══ 3D Tilt ═══ */
function useTilt(maxTilt = 8) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tt, setTT] = useState({ x: 0, y: 0 })
  const [glow, setGlow] = useState({ x: 50, y: 50 })
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const rm = useReducedMotion()

  const tx = useSpring(tt.x, SP.gentle)
  const ty = useSpring(tt.y, SP.gentle)
  const sc = useSpring(pressed ? 0.975 : hovered ? 1.012 : 1, SP.snappy)

  const move = useCallback((cx: number, cy: number) => {
    const el = cardRef.current
    if (!el || rm) return
    const r = el.getBoundingClientRect()
    const px = (cx - r.left) / r.width
    const py = (cy - r.top) / r.height
    setTT({ x: (py - 0.5) * -maxTilt, y: (px - 0.5) * maxTilt })
    setGlow({ x: px * 100, y: py * 100 })
  }, [maxTilt, rm])

  const style = useMemo(() => rm ? {} : {
    transform: `perspective(800px) rotateX(${tx}deg) rotateY(${ty}deg) scale(${sc})`,
  }, [tx, ty, sc, rm])

  return {
    cardRef, style, glow, hovered,
    handlers: {
      onMouseMove: (e: React.MouseEvent) => move(e.clientX, e.clientY),
      onTouchMove: (e: React.TouchEvent) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY) },
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => { setHovered(false); setPressed(false); setTT({ x: 0, y: 0 }); setGlow({ x: 50, y: 50 }) },
      onMouseDown: () => setPressed(true),
      onMouseUp: () => setPressed(false),
      onTouchStart: () => setPressed(true),
      onTouchEnd: () => setPressed(false),
    },
  }
}

/* ═══ Utilities ═══ */
function useInView(th = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setV(true); obs.disconnect() } }, { threshold: th })
    obs.observe(el)
    return () => obs.disconnect()
  }, [th])
  return { ref, visible: v }
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView(0.06)
  const rm = useReducedMotion()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible || rm ? 'translateY(0)' : 'translateY(18px)',
      transition: rm ? 'none' : `opacity 0.45s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.45s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>{children}</div>
  )
}

function useCountUp(target: number, dur = 1000) {
  const [v, setV] = useState(0)
  const rm = useReducedMotion()
  useEffect(() => {
    if (rm || target <= 0) { setV(target); return }
    let c = false
    const t0 = performance.now()
    const tick = (now: number) => {
      if (c) return
      const p = Math.min((now - t0) / dur, 1)
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return () => { c = true }
  }, [target, dur, rm])
  return v
}

function daysNights(s: string, e: string) {
  const d = Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 864e5) + 1
  return { days: d, nights: d - 1 }
}

function fmtDate(s: string, e: string) {
  const sd = new Date(s), ed = new Date(e)
  const m = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  if (sd.getMonth() === ed.getMonth() && sd.getFullYear() === ed.getFullYear())
    return `${sd.getDate()} – ${ed.getDate()} ${m[sd.getMonth()]} ${sd.getFullYear()}`
  return `${sd.getDate()} ${m[sd.getMonth()]} – ${ed.getDate()} ${m[ed.getMonth()]} ${sd.getFullYear()}`
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/* ═══════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════ */
export default function HomeClient({ initialData }: { initialData: HomeData }) {
  const { data } = useApi<HomeData>('/api/my-tours', { fallbackData: initialData })
  const tours = data?.tours ?? initialData.tours
  const user = data?.user ?? initialData.user

  const active = tours.filter(t => t.status === 'ACTIVE')
  const upcoming = tours.filter(t => t.status === 'PUBLISHED')
  const allUpcoming = [...active, ...upcoming]
  const history = tours.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')

  const nextTrip = allUpcoming[0] ?? null
  const countdown = nextTrip ? getTripCountdown(new Date(nextTrip.startDate), new Date(nextTrip.endDate)) : null
  const daysLeft = countdown?.daysUntilDeparture ?? 0
  const animDays = useCountUp(daysLeft > 0 ? daysLeft : 0)

  return (
    <div className="min-h-screen" style={{ background: '#faf8f5' }}>
      <style>{`
        @keyframes shimmer { to { background-position: 200% center } }
        @keyframes pulse-soft { 0%,100% { opacity: 0.7 } 50% { opacity: 1 } }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl"
        style={{ background: 'rgba(250,248,245,0.85)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[13px] flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', animation: 'float 3.5s ease-in-out infinite' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 17L10 12L5 10L18 6L14 19L12 14L5 17Z" fill="white" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-medium" style={{ color: '#b8a394' }}>{greeting()}</p>
                <h1 className="text-[16px] font-semibold" style={{ color: '#2c1810', letterSpacing: '-0.01em' }}>{user.name}</h1>
              </div>
            </div>
            <Link href="/profile" className="no-btn-fx">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-orange-100 hover:ring-orange-300 transition-all duration-300 shadow-sm">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" width={40} height={40} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-orange-600"
                    style={{ background: '#fff4ed' }}>{user.name[0]}</div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 pt-5 pb-32">

        {/* ── Hero ── */}
        {nextTrip && daysLeft > 0 && (
          <Reveal>
            <HeroCard trip={nextTrip} animDays={animDays} />
          </Reveal>
        )}

        {/* ── Stats ── */}
        <Reveal delay={60}>
          <div className="flex items-center gap-5 mt-6 mb-8">
            <StatPill val={allUpcoming.length} label="upcoming" />
            <StatPill val={history.length} label="completed" />
            <StatPill val={new Set(tours.flatMap(t => t.countries)).size} label="countries" />
          </div>
        </Reveal>

        {/* ── Active ── */}
        {active.length > 0 && (
          <Section label="Travelling Now" live>
            {active.map((t, i) => <Reveal key={t.id} delay={i * 60}><Card tour={t} variant="active" /></Reveal>)}
          </Section>
        )}

        {/* ── Upcoming ── */}
        {upcoming.length > 0 && (
          <Section label="Upcoming">
            {upcoming.map((t, i) => <Reveal key={t.id} delay={i * 60}><Card tour={t} variant="upcoming" /></Reveal>)}
          </Section>
        )}

        {/* ── History ── */}
        {history.length > 0 && (
          <Section label="Past Trips" dim>
            {history.map((t, i) => <Reveal key={t.id} delay={i * 40}><SmallCard tour={t} /></Reveal>)}
          </Section>
        )}

        {tours.length === 0 && (
          <Reveal>
            <div className="rounded-2xl p-12 text-center mt-4 bg-white" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#fff4ed' }}>
                <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold" style={{ color: '#2c1810' }}>No trips yet</p>
              <p className="text-sm mt-2 max-w-[280px] mx-auto" style={{ color: '#b8a394' }}>
                รอรับคำเชิญจากผู้จัดทัวร์ หรือขอให้ admin เพิ่มคุณเข้าทริป
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  )
}

/* ═══ Hero Card ═══ */
function HeroCard({ trip, animDays }: { trip: TourItem; animDays: number }) {
  const { cardRef, style, glow, hovered, handlers } = useTilt(5)

  return (
    <Link href={`/tour/${trip.id}/today`} className="block no-btn-fx">
      <div ref={cardRef} className="relative rounded-[22px] overflow-hidden will-change-transform cursor-pointer"
        style={{
          ...style, transformStyle: 'preserve-3d',
          boxShadow: hovered
            ? '0 24px 56px -12px rgba(234,88,12,0.2), 0 8px 24px -4px rgba(0,0,0,0.08)'
            : '0 4px 24px -4px rgba(234,88,12,0.12), 0 1px 4px rgba(0,0,0,0.04)',
        }} {...handlers}>

        {/* Glow */}
        <div className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300 rounded-[22px]"
          style={{ opacity: hovered ? 1 : 0, background: `radial-gradient(400px at ${glow.x}% ${glow.y}%, rgba(251,146,60,0.2), transparent 55%)` }} />

        {/* Image */}
        <div className="relative h-[190px] sm:h-[230px]">
          {trip.coverImageUrl ? (
            <Image src={trip.coverImageUrl} alt="" fill unoptimized
              className="object-cover transition-transform duration-700"
              style={{ transform: hovered ? 'scale(1.03)' : 'scale(1)' }} />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }} />
          )}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(120,50,0,0.85) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.1) 100%)',
          }} />
        </div>

        {/* Content */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 sm:p-7">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] mb-3"
                style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: '#fff' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-300" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
                Next Trip
              </div>
              <h2 className="text-[22px] sm:text-[26px] font-bold text-white leading-tight truncate" style={{ letterSpacing: '-0.02em' }}>
                {trip.title}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[13px] text-white/50 font-medium">{fmtDate(trip.startDate, trip.endDate)}</span>
                <span className="text-white/20">·</span>
                <span className="text-[12px] text-white/40 font-medium">{FLAGS[trip.primaryCountry]} {trip.cities.slice(0, 2).join(', ')}</span>
              </div>
            </div>
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="text-[56px] sm:text-[68px] font-black text-white leading-none tabular-nums"
                style={{ letterSpacing: '-0.04em', textShadow: '0 4px 24px rgba(234,88,12,0.4)' }}>
                {animDays}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 mt-0.5">days</span>
            </div>
          </div>
        </div>

        {/* Bottom gradient bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] z-20"
          style={{ background: 'linear-gradient(90deg, #f97316, #fb923c, #f59e0b, #f97316)', backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }} />
      </div>
    </Link>
  )
}

/* ═══ Stat Pill ═══ */
function StatPill({ val, label }: { val: number; label: string }) {
  const d = useCountUp(val, 800)
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
      style={{ background: 'rgba(249,115,22,0.06)' }}>
      <span className="text-[20px] font-bold tabular-nums" style={{ color: '#ea580c', letterSpacing: '-0.02em' }}>{d}</span>
      <span className="text-[11px] font-medium" style={{ color: '#c4956e' }}>{label}</span>
    </div>
  )
}

/* ═══ Section ═══ */
function Section({ label, live, dim, children }: { label: string; live?: boolean; dim?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <Reveal>
        <div className="flex items-center gap-2.5 mb-5">
          {live && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
          )}
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: dim ? '#c4b5a5' : '#a0785c' }}>{label}</h2>
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.04)' }} />
        </div>
      </Reveal>
      <div className={dim
        ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
        {children}
      </div>
    </div>
  )
}

/* ═══ Tour Card — fixed height, title on image ═══ */
function Card({ tour, variant }: { tour: TourItem; variant: 'active' | 'upcoming' }) {
  const { cardRef, style, glow, hovered, handlers } = useTilt(8)
  const cd = getTripCountdown(new Date(tour.startDate), new Date(tour.endDate))
  const { days, nights } = daysNights(tour.startDate, tour.endDate)
  const b = tour.days.filter(d => d.mealBreakfast).length
  const l = tour.days.filter(d => d.mealLunch).length
  const dinner = tour.days.filter(d => d.mealDinner).length

  return (
    <Link href={`/tour/${tour.id}/today`} className="block no-btn-fx h-full">
      <div ref={cardRef} className="relative rounded-[18px] overflow-hidden will-change-transform bg-white h-full flex flex-col"
        style={{
          ...style, transformStyle: 'preserve-3d',
          boxShadow: hovered
            ? '0 16px 40px -8px rgba(234,88,12,0.15), 0 6px 16px -4px rgba(0,0,0,0.08)'
            : '0 1px 4px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.06)',
        }} {...handlers}>

        {/* Glow */}
        <div className="absolute inset-0 z-10 pointer-events-none rounded-[18px] transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0, background: `radial-gradient(350px at ${glow.x}% ${glow.y}%, rgba(251,146,60,0.12), transparent 55%)` }} />

        {/* Image with title overlay */}
        <div className="relative h-[200px] overflow-hidden flex-shrink-0">
          {tour.coverImageUrl ? (
            <Image src={tour.coverImageUrl} alt="" fill unoptimized className="object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #fed7aa, #fdba74)' }} />
          )}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.05) 100%)',
          }} />

          {/* Country */}
          <div className="absolute top-3 right-3 z-20">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md shadow-sm"
              style={{ background: 'rgba(255,255,255,0.9)', color: '#78350f' }}>
              {FLAGS[tour.primaryCountry]} {tour.primaryCountry}
            </span>
          </div>

          {/* Status */}
          {variant === 'active' ? (
            <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-sm"
              style={{ background: '#10b981' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              Day {cd.currentDayNumber}
            </div>
          ) : cd.daysUntilDeparture !== undefined && cd.daysUntilDeparture > 0 ? (
            <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              {cd.daysUntilDeparture} วัน
            </div>
          ) : null}

          {/* Title on image */}
          <div className="absolute bottom-3 left-4 right-4 z-20">
            <h3 className="text-white font-bold text-[16px] leading-snug line-clamp-2"
              style={{ letterSpacing: '-0.01em', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
              {tour.title}
            </h3>
          </div>
        </div>

        {/* Info — fixed structure, no variable title height */}
        <div className="px-4 py-3.5 flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[13px] min-w-0" style={{ color: '#7c5a3e' }}>
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
              </svg>
              <span className="truncate">{tour.cities.slice(0, 3).join(', ')}</span>
            </div>
            <span className="text-[12px] font-semibold flex-shrink-0 tabular-nums" style={{ color: '#9a7b5e' }}>{days}D{nights}N</span>
          </div>

          <div className="text-[12px] font-medium" style={{ color: '#9a7b5e' }}>
            {fmtDate(tour.startDate, tour.endDate)}
          </div>

          {/* Meals + meta */}
          <div className="flex items-center justify-between mt-auto pt-2.5" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="flex items-center gap-1">
              {b > 0 && <MealBadge emoji="🌅" count={b} />}
              {l > 0 && <MealBadge emoji="🍱" count={l} />}
              {dinner > 0 && <MealBadge emoji="🌙" count={dinner} />}
            </div>
            <div className="flex items-center gap-2">
              {tour.isChina && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: '#fef2f2', color: '#dc2626' }}>CN</span>
              )}
              <span className="text-[11px] font-medium" style={{ color: '#9a7b5e' }}>
                {tour._count?.members ?? 0} members
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ═══ Meal Badge ═══ */
function MealBadge({ emoji, count }: { emoji: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 h-[22px] px-2 rounded-full text-[11px] font-semibold"
      style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
      <span className="text-[10px]">{emoji}</span>{count}
    </span>
  )
}

/* ═══ Small History Card — fixed height ═══ */
function SmallCard({ tour }: { tour: TourItem }) {
  const cancelled = tour.status === 'CANCELLED'
  const { days, nights } = daysNights(tour.startDate, tour.endDate)

  return (
    <Link href={`/tour/${tour.id}/today`} className="block no-btn-fx group h-full">
      <div className="rounded-xl overflow-hidden bg-white transition-all duration-300 group-hover:shadow-md h-full flex flex-col"
        style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="relative h-[120px] sm:h-[130px] overflow-hidden flex-shrink-0">
          {tour.coverImageUrl ? (
            <Image src={tour.coverImageUrl} alt="" fill unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ filter: cancelled ? 'grayscale(70%) brightness(0.85)' : 'none' }} />
          ) : (
            <div className="w-full h-full" style={{ background: '#fed7aa' }} />
          )}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          }} />
          {cancelled && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500 text-white">
              ยกเลิก
            </div>
          )}
          <div className="absolute bottom-2 left-2.5 right-2.5">
            <p className="text-white font-semibold text-[13px] leading-tight line-clamp-2"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{tour.title}</p>
          </div>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[11px] truncate" style={{ color: '#7c5a3e' }}>
            {tour.cities.slice(0, 2).join(', ')}
          </p>
          <p className="text-[10px] mt-0.5 tabular-nums font-medium" style={{ color: '#9a7b5e' }}>
            {days} วัน {nights} คืน
          </p>
        </div>
      </div>
    </Link>
  )
}
