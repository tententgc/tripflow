'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useApi } from '@/lib/swr'
import { getTripCountdown } from '@tripflow/utils'

/* ── Constants ────────────────────────────────────────── */
const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭',
  FR: '🇫🇷', IT: '🇮🇹', GB: '🇬🇧', DE: '🇩🇪',
  SG: '🇸🇬', AU: '🇦🇺', US: '🇺🇸', MY: '🇲🇾',
  TW: '🇹🇼', VN: '🇻🇳', HK: '🇭🇰', AE: '🇦🇪',
  ES: '🇪🇸', CH: '🇨🇭', NZ: '🇳🇿', ID: '🇮🇩',
}

const countryNames: Record<string, string> = {
  CN: 'จีน', JP: 'ญี่ปุ่น', KR: 'เกาหลี', TH: 'ไทย',
  FR: 'ฝรั่งเศส', IT: 'อิตาลี', GB: 'อังกฤษ', DE: 'เยอรมนี',
  SG: 'สิงคโปร์', AU: 'ออสเตรเลีย', US: 'อเมริกา', MY: 'มาเลเซีย',
  TW: 'ไต้หวัน', VN: 'เวียดนาม', HK: 'ฮ่องกง', AE: 'UAE',
  ES: 'สเปน', CH: 'สวิตเซอร์แลนด์', NZ: 'นิวซีแลนด์', ID: 'อินโดนีเซีย',
}

/* ── Types ────────────────────────────────────────────── */
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

/* ── Hooks ────────────────────────────────────────────── */
function useCountUp(target: number, dur = 1200) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (target <= 0) { setV(0); return }
    let cancelled = false
    const t0 = performance.now()
    const tick = (now: number) => {
      if (cancelled) return
      const p = Math.min((now - t0) / dur, 1)
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return () => { cancelled = true }
  }, [target, dur])
  return v
}

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ── Reveal component ─────────────────────────────────── */
function Reveal({ children, className = '', delay = 0, direction = 'up' }: {
  children: React.ReactNode; className?: string; delay?: number
  direction?: 'up' | 'left' | 'right' | 'scale'
}) {
  const { ref, visible } = useInView(0.08)
  const transforms: Record<string, string> = {
    up: 'translateY(32px)', left: 'translateX(-32px)',
    right: 'translateX(32px)', scale: 'scale(0.96)',
  }
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translate(0) scale(1)' : transforms[direction],
      transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>{children}</div>
  )
}

/* ── Gradient border card ─────────────────────────────── */
function GlowCard({ children, className = '', href }: {
  children: React.ReactNode; className?: string; href?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const handleMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const inner = (
    <div
      ref={cardRef}
      className={`relative group ${className}`}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow border */}
      <div className="absolute -inset-px rounded-2xl transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(500px circle at ${pos.x}px ${pos.y}px, rgba(99,102,241,0.25), rgba(139,92,246,0.12), transparent 60%)`,
        }} />
      {/* Default border */}
      <div className="absolute -inset-px rounded-2xl transition-opacity duration-300 pointer-events-none"
        style={{ opacity: hovered ? 0 : 1, border: '1px solid rgba(226,232,240,0.9)' }} />
      {/* Content */}
      <div className="relative bg-white rounded-2xl overflow-hidden h-full transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-indigo-500/[0.06]">
        {children}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block no-btn-fx opacity-100 hover:opacity-100">{inner}</Link>
  }
  return inner
}

/* ── Helpers ──────────────────────────────────────────── */
function getDaysAndNights(startDate: string, endDate: string) {
  const s = new Date(startDate)
  const e = new Date(endDate)
  const days = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const nights = days - 1
  return { days, nights }
}

function formatDateRange(startDate: string, endDate: string) {
  const s = new Date(startDate)
  const e = new Date(endDate)
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()} - ${e.getDate()} ${months[s.getMonth()]} ${s.getFullYear()}`
  }
  return `${s.getDate()} ${months[s.getMonth()]} - ${e.getDate()} ${months[e.getMonth()]} ${s.getFullYear()}`
}

/* ── Main component ───────────────────────────────────── */
export default function HomeClient({ initialData }: { initialData: HomeData }) {
  const { data } = useApi<HomeData>('/api/my-tours', { fallbackData: initialData })
  const tours = data?.tours ?? initialData.tours
  const user = data?.user ?? initialData.user

  const active = tours.filter(t => t.status === 'ACTIVE')
  const upcoming = tours.filter(t => t.status === 'PUBLISHED')
  const allUpcoming = [...active, ...upcoming]
  const history = tours.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')

  const nextTrip = allUpcoming[0] ?? null
  const nextCountdown = nextTrip ? getTripCountdown(new Date(nextTrip.startDate), new Date(nextTrip.endDate)) : null
  const daysUntilDeparture = nextCountdown?.daysUntilDeparture ?? 0
  const animatedDays = useCountUp(daysUntilDeparture > 0 ? daysUntilDeparture : 0)

  const totalMembers = tours.reduce((s, t) => s + (t._count?.members ?? 0), 0)
  const totalCountries = new Set(tours.flatMap(t => t.countries)).size

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(226,232,240,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(226,232,240,0.35) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 20%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 20%, transparent 100%)',
      }} />

      {/* ── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" opacity="0.3" />
                  <path d="M5 17L10 12L5 10L18 6L14 19L12 14L5 17Z" fill="white" fillOpacity="0.95" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium leading-none">สวัสดี</p>
                <h1 className="text-[15px] font-bold text-gray-900 leading-tight">{user.name}</h1>
              </div>
            </div>
            <Link href="/profile" className="no-btn-fx">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-gray-100 hover:ring-indigo-200 transition-all duration-200"
                style={{ background: '#f1f5f9' }}>
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" width={40} height={40} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                ) : (
                  <span className="text-indigo-600 font-bold text-sm">{user.name[0]}</span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-28">

        {/* Stats bar */}
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            } iconBg="bg-indigo-50" iconColor="text-indigo-600" value={allUpcoming.length} label="ทริปที่จะมาถึง" />

            <StatCard icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            } iconBg="bg-emerald-50" iconColor="text-emerald-600" value={history.length} label="เดินทางเสร็จแล้ว" />

            <StatCard icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            } iconBg="bg-blue-50" iconColor="text-blue-600" value={totalMembers} label="สมาชิกทั้งหมด" />

            <StatCard icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864a4.5 4.5 0 010 6.635.953.953 0 00-.405.864v.568m0-8.93A6.002 6.002 0 019 7.5c0 1.326.43 2.55 1.159 3.544a.953.953 0 01-.154 1.272 3.001 3.001 0 00-1.005 2.244v3.69m3.75-14.22v.568c0 .334-.148.65-.405.864a4.5 4.5 0 000 6.635.953.953 0 01.405.864v.568m0-8.93A6.002 6.002 0 0115 7.5c0 1.326-.43 2.55-1.159 3.544a.953.953 0 00.154 1.272A3 3 0 0115 14.556v3.694M9 20.25h6M3.375 18h.008v.008h-.008V18zm0 0h17.25M3.375 18V6.375A2.625 2.625 0 016 3.75h12a2.625 2.625 0 012.625 2.625V18" />
              </svg>
            } iconBg="bg-violet-50" iconColor="text-violet-600" value={totalCountries} label="ประเทศปลายทาง" />
          </div>
        </Reveal>

        {/* Next departure banner */}
        {nextTrip && daysUntilDeparture > 0 && (
          <Reveal delay={100}>
            <div className="mb-8">
              <GlowCard href={`/tour/${nextTrip.id}/today`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 sm:p-6">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">ออกเดินทางครั้งต่อไป</p>
                      <p className="text-base font-bold text-gray-900 mt-0.5 truncate">{nextTrip.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDateRange(nextTrip.startDate, nextTrip.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1.5 flex-shrink-0 sm:text-right">
                    <span className="text-4xl sm:text-5xl font-bold tabular-nums" style={{
                      background: 'linear-gradient(135deg, #4338ca, #6366f1, #8b5cf6)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      {animatedDays}
                    </span>
                    <span className="text-sm text-gray-400 pb-1 font-medium">วัน</span>
                  </div>
                </div>
              </GlowCard>
            </div>
          </Reveal>
        )}

        {/* ── Tours ─────────────────────────────────────── */}
        {tours.length === 0 ? (
          <Reveal>
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <p className="text-gray-900 font-bold text-lg">ยังไม่มีทริป</p>
              <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">รอรับคำเชิญจากผู้จัดทัวร์ หรือขอให้ admin เพิ่มคุณเข้าทริป</p>
            </div>
          </Reveal>
        ) : (
          <div className="flex flex-col gap-10">

            {/* Active trips */}
            {active.length > 0 && (
              <TripSection title="กำลังเดินทาง" dotColor="bg-emerald-500" tours={active} variant="active" />
            )}

            {/* Upcoming trips */}
            {upcoming.length > 0 && (
              <TripSection title="ทริปที่จะมาถึง" dotColor="bg-indigo-500" tours={upcoming} variant="upcoming" />
            )}

            {/* History */}
            {history.length > 0 && (
              <div>
                <Reveal>
                  <SectionHeader title="ประวัติการเดินทาง" dotColor="bg-gray-300" />
                </Reveal>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {history.map((tour, i) => (
                    <Reveal key={tour.id} delay={i * 60}>
                      <HistoryCard tour={tour} />
                    </Reveal>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Stat card ────────────────────────────────────────── */
function StatCard({ icon, iconBg, iconColor, value, label }: {
  icon: React.ReactNode; iconBg: string; iconColor: string
  value: number; label: string
}) {
  const display = useCountUp(value, 1000)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{display}</p>
          <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Section header ───────────────────────────────────── */
function SectionHeader({ title, dotColor }: { title: string; dotColor: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

/* ── Trip section ─────────────────────────────────────── */
function TripSection({ title, dotColor, tours, variant }: {
  title: string; dotColor: string; tours: TourItem[]; variant: 'active' | 'upcoming'
}) {
  return (
    <div>
      <Reveal>
        <SectionHeader title={title} dotColor={dotColor} />
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tours.map((tour, i) => (
          <Reveal key={tour.id} delay={i * 80}>
            <TripCard tour={tour} variant={variant} />
          </Reveal>
        ))}
      </div>
    </div>
  )
}

/* ── Trip card ────────────────────────────────────────── */
function TripCard({ tour, variant }: { tour: TourItem; variant: 'active' | 'upcoming' }) {
  const countdown = getTripCountdown(new Date(tour.startDate), new Date(tour.endDate))
  const { days, nights } = getDaysAndNights(tour.startDate, tour.endDate)
  const b = tour.days.filter(d => d.mealBreakfast).length
  const l = tour.days.filter(d => d.mealLunch).length
  const dn = tour.days.filter(d => d.mealDinner).length
  const flags = tour.countries.map(c => countryFlags[c] ?? '').filter(Boolean).join(' ')
  const primaryName = countryNames[tour.primaryCountry] ?? tour.primaryCountry

  return (
    <GlowCard href={`/tour/${tour.id}/today`}>
      {/* Image */}
      <div className="relative overflow-hidden h-[200px]">
        {tour.coverImageUrl ? (
          <Image src={tour.coverImageUrl} alt="" fill unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Country badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
            {flags} {tour.primaryCountry}
          </span>
        </div>

        {/* Active badge */}
        {variant === 'active' && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500 text-white shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            กำลังเดินทาง
          </div>
        )}

        {/* Title on image */}
        <div className="absolute bottom-3 left-3.5 right-14">
          <h3 className="text-white font-bold text-base leading-snug line-clamp-2 drop-shadow-md">
            {tour.title}
          </h3>
        </div>

        {/* Countdown badge */}
        {countdown.daysUntilDeparture !== undefined && countdown.daysUntilDeparture > 0 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500 text-white shadow-sm">
            {countdown.daysUntilDeparture} วัน
          </div>
        )}
        {countdown.status === 'active' && countdown.currentDayNumber && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 text-white shadow-sm">
            Day {countdown.currentDayNumber}/{countdown.totalDays}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Location & duration */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
            </svg>
            <span className="truncate">{tour.cities.slice(0, 3).join(', ')}</span>
          </div>
          <span className="text-xs font-semibold text-gray-400 flex-shrink-0 tabular-nums">
            {days} วัน {nights} คืน
          </span>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span>{formatDateRange(tour.startDate, tour.endDate)}</span>
        </div>

        {/* Meal badges */}
        {(b > 0 || l > 0 || dn > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {b > 0 && (
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                <span className="text-xs">🌅</span> เช้า {b}
              </span>
            )}
            {l > 0 && (
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-100">
                <span className="text-xs">🍱</span> กลางวัน {l}
              </span>
            )}
            {dn > 0 && (
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-100">
                <span className="text-xs">🌙</span> เย็น {dn}
              </span>
            )}
          </div>
        )}

        {/* Members count */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span className="text-xs text-gray-400">{tour._count?.members ?? 0} สมาชิก</span>
          {tour.isChina && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              🇨🇳 China Mode
            </span>
          )}
        </div>
      </div>
    </GlowCard>
  )
}

/* ── History card ─────────────────────────────────────── */
function HistoryCard({ tour }: { tour: TourItem }) {
  const cancelled = tour.status === 'CANCELLED'
  const { days, nights } = getDaysAndNights(tour.startDate, tour.endDate)

  return (
    <GlowCard href={`/tour/${tour.id}/today`}>
      <div className="relative overflow-hidden h-[120px] sm:h-[140px]">
        {tour.coverImageUrl ? (
          <Image src={tour.coverImageUrl} alt="" fill unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ filter: cancelled ? 'grayscale(80%) brightness(0.85)' : 'saturate(0.85) brightness(0.95)' }} />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {cancelled && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500 text-white">
            ยกเลิก
          </div>
        )}

        <div className="absolute bottom-2 left-2.5 right-2.5">
          <p className="text-white font-bold text-[13px] truncate drop-shadow-md">{tour.title}</p>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[11px] text-gray-400 truncate">
          {tour.cities.slice(0, 2).join(', ')} &middot; {days} วัน {nights} คืน
        </p>
      </div>
    </GlowCard>
  )
}
