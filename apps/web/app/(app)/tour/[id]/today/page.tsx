'use client'

import { useState, useCallback, useEffect, useRef, forwardRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { useApi } from '@/lib/swr'

// ── Weather types & helpers ──
interface WeatherDay {
  date: string
  maxTemp: number
  minTemp: number
  icon: string
  desc: string
}

const weatherIcons: Record<string, string> = {
  'Clear': '☀️', 'Sunny': '☀️', 'Partly cloudy': '⛅', 'Cloudy': '☁️', 'Overcast': '☁️',
  'Mist': '🌫️', 'Fog': '🌫️', 'Light rain': '🌦️', 'Rain': '🌧️', 'Heavy rain': '🌧️',
  'Light drizzle': '🌦️', 'Patchy rain possible': '🌦️', 'Moderate rain': '🌧️',
  'Thundery outbreaks possible': '⛈️', 'Snow': '🌨️', 'Light snow': '🌨️',
  'Patchy light rain with thunder': '⛈️', 'Moderate or heavy rain with thunder': '⛈️',
}
function getWeatherIcon(desc: string): string {
  return weatherIcons[desc] ?? (desc.includes('rain') || desc.includes('Rain') ? '🌧️' : desc.includes('cloud') || desc.includes('Cloud') ? '☁️' : '🌤️')
}

function useWeather(city: string | null, tripStartDate: string | null) {
  const [days, setDays] = useState<WeatherDay[]>([])
  const [loading, setLoading] = useState(false)
  const [tooFarAhead, setTooFarAhead] = useState(false)

  useEffect(() => {
    if (!city || !tripStartDate) return

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const start = new Date(tripStartDate); start.setHours(0, 0, 0, 0)
    const daysUntil = Math.ceil((start.getTime() - today.getTime()) / 86400000)

    if (daysUntil > 3) {
      setTooFarAhead(true)
      setDays([])
      return
    }

    setTooFarAhead(false)
    setLoading(true)
    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
      .then(r => r.json())
      .then((data: { weather?: Array<{ date: string; maxtempC: string; mintempC: string; hourly: Array<{ weatherDesc: Array<{ value: string }> }> }> }) => {
        const w = data.weather ?? []
        const startTs = start.getTime()
        setDays(w
          .map(d => ({
            date: d.date,
            maxTemp: parseInt(d.maxtempC),
            minTemp: parseInt(d.mintempC),
            icon: getWeatherIcon(d.hourly?.[4]?.weatherDesc?.[0]?.value ?? ''),
            desc: d.hourly?.[4]?.weatherDesc?.[0]?.value ?? '',
          }))
          .filter(d => new Date(d.date).getTime() >= startTs)
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [city, tripStartDate])
  return { days, loading, tooFarAhead }
}

// ── Animated counter hook ──
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const ref = useRef<number | null>(null)

  useEffect(() => {
    if (target <= 0) { setValue(0); return }
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [target, duration])

  return value
}

interface Activity {
  id: string
  time: string | null
  title: string
  titleEn: string | null
  titleLocal: string | null
  description: string | null
  category: string
  locationName: string | null
  address: string | null
  addressLocal: string | null
  durationMins: number | null
  cost: number | null
  costCurrency: string | null
  costTHB: number | null
  tips: string | null
  imageUrls: string[]
}

interface Transport {
  id: string
  type: string
  from: string
  fromLocal: string | null
  to: string
  toLocal: string | null
  departTime: string | null
  arriveTime: string | null
  duration: string | null
  lineName: string | null
  lineNameLocal: string | null
  notes: string | null
}

interface Accommodation {
  name: string
  nameLocal: string | null
  phone: string | null
  checkIn: string | null
  checkOut: string | null
  wifiName: string | null
  wifiPassword: string | null
  imageUrl: string | null
}

interface Flight {
  id: string
  flightNo: string
  airline: string
  airlineIata: string | null
  fromAirport: string
  fromIata: string
  toAirport: string
  toIata: string
  departAt: string
  arriveAt: string
  departTz: string
  arriveTz: string
  terminal: string | null
  gate: string | null
}

interface ChecklistCheck {
  id: string
  userId: string
}

interface ChecklistItemData {
  id: string
  label: string
  labelEn: string | null
  isImportant: boolean
  order: number
  checks: ChecklistCheck[]
}

interface ChecklistData {
  id: string
  title: string
  emoji: string | null
  type: string
  items: ChecklistItemData[]
}

interface Announcement {
  id: string
  title: string
  content: string
  imageUrls: string[]
  order: number
  isPinned: boolean
  createdAt: string
}

interface TourData {
  id: string
  title: string
  startDate: string
  endDate: string
  isChina: boolean
  countries: string[]
  days: Array<{
    id: string
    dayNumber: number
    date: string
    title: string
    city: string | null
    country: string | null
    summary: string | null
    mealBreakfast: boolean
    mealLunch: boolean
    mealDinner: boolean
    activities: Activity[]
    transports: Transport[]
    accommodation: Accommodation | null
  }>
  flights: Flight[]
  contacts: Array<{ id: string; name: string; nameLocal: string | null; phone: string | null; wechat: string | null; line: string | null; whatsapp: string | null; type: string; notes: string | null }>
  members: Array<{ user: { name: string } }>
}

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷', VN: '🇻🇳',
}

const categoryIcons: Record<string, string> = {
  SIGHTSEEING: '🏛️', FOOD: '🍜', TRANSPORT: '🚌',
  ACCOMMODATION: '🏨', SHOPPING: '🛍️', TEMPLE: '⛩️',
  NATURE: '🌿', NIGHTLIFE: '🌃', PHOTOGRAPHY: '📷', OTHER: '📍',
}

const categoryColors: Record<string, string> = {
  SIGHTSEEING: 'bg-blue-500', FOOD: 'bg-orange-500',
  TRANSPORT: 'bg-gray-400', ACCOMMODATION: 'bg-violet-500',
  SHOPPING: 'bg-pink-500', TEMPLE: 'bg-yellow-500',
  NATURE: 'bg-green-500', NIGHTLIFE: 'bg-purple-500',
}

const transportIcons: Record<string, string> = {
  FLIGHT: '✈️', TRAIN: '🚂', HIGHSPEED_TRAIN: '🚄', SUBWAY: '🚇',
  BUS: '🚌', TAXI: '🚕', FERRY: '⛴️', CABLE_CAR: '🚡', WALK: '🚶', OTHER: '🚗',
}

// ── Light glassmorphism design tokens ──
const glassCard = [
  'rounded-2xl',
  'border',
  'border-t-white/85 border-l-white/85',
  'border-b-[rgba(180,180,200,0.3)] border-r-[rgba(180,180,200,0.3)]',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_32px_rgba(100,80,160,0.08),0_2px_8px_rgba(0,0,0,0.04)]',
].join(' ')
const glassBg = 'bg-[rgba(255,255,255,0.6)] backdrop-blur-[20px] backdrop-saturate-[160%]'
const sectionDivider = 'mx-6 h-px bg-[rgba(0,0,0,0.06)]'
const primaryText = 'text-[#1a1a2e]'
const secondaryText = 'text-[rgba(30,30,60,0.45)]'
const headerText = 'text-[#3d3a5c]'
const accentGlow = '[text-shadow:0_0_12px_rgba(100,60,240,0.15)]'
const flightNumColor = 'text-[#5b3fde]'

export default function TodayPage() {
  const params = useParams()
  const tourId = params.id as string
  const { data: tour, isLoading: loadingTour } = useApi<TourData>(`/api/tours/${tourId}`)
  const { data: checklistsRaw, mutate: mutateChecklists } = useApi<ChecklistData[]>(`/api/tours/${tourId}/checklist`)
  const { data: announcementsRaw } = useApi<Announcement[]>(`/api/tours/${tourId}/announcements`)
  const { data: me } = useApi<{ id: string }>('/api/auth/me')
  const loading = loadingTour
  const checklists = Array.isArray(checklistsRaw) ? checklistsRaw : []
  const announcements = Array.isArray(announcementsRaw) ? announcementsRaw : []
  const userId = me?.id ?? null
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const toggleCheck = useCallback(async (itemId: string, currentlyChecked: boolean) => {
    if (!userId) return
    mutateChecklists(
      (prev) => prev?.map(cl => ({
        ...cl,
        items: cl.items.map(item =>
          item.id === itemId
            ? {
                ...item,
                checks: currentlyChecked
                  ? item.checks.filter(c => c.userId !== userId)
                  : [...item.checks, { id: 'temp', userId }],
              }
            : item
        ),
      })),
      false,
    )

    await fetch(`/api/tours/${tourId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, userId, checked: !currentlyChecked }),
    })
  }, [userId, tourId, mutateChecklists])

  const weatherCity = tour?.days?.[0]?.city ?? null
  const weatherStartDate = tour?.startDate ?? null
  const { days: weatherDays, loading: weatherLoading, tooFarAhead: weatherTooFar } = useWeather(weatherCity, weatherStartDate)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f8] animate-pulse">
        <div className="bg-[rgba(255,255,255,0.6)] backdrop-blur-[20px] px-4 pt-safe-top pb-5">
          <div className="flex items-center gap-3 pt-4">
            <div className="w-8 h-8 rounded-full bg-[rgba(100,80,160,0.08)]" />
            <div className="flex-1">
              <div className="h-4 w-40 bg-[rgba(100,80,160,0.1)] rounded mb-1" />
              <div className="h-3 w-28 bg-[rgba(100,80,160,0.06)] rounded" />
            </div>
            <div className="w-9 h-9 rounded-full bg-[rgba(100,80,160,0.08)]" />
          </div>
        </div>
        <div className="px-4 pt-5 space-y-5">
          <div className={`${glassBg} ${glassCard} h-16`} />
          <div className={`${glassBg} ${glassCard} h-48`} />
          <div className={`${glassBg} ${glassCard} h-56`} />
        </div>
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
        <p className={secondaryText}>ไม่พบทริปนี้</p>
      </div>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tripStart = new Date(tour.startDate)
  tripStart.setHours(0, 0, 0, 0)
  const tripEnd = new Date(tour.endDate)
  tripEnd.setHours(0, 0, 0, 0)
  const isBeforeTrip = today < tripStart
  const daysUntilTrip = isBeforeTrip ? Math.ceil((tripStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0

  const currentDay = tour.days.find((d) => {
    const dayDate = new Date(d.date)
    dayDate.setHours(0, 0, 0, 0)
    return dayDate.getTime() === today.getTime()
  }) ?? tour.days[0]

  const guide = tour.contacts.find((c) => c.type === 'THAI_GUIDE' || c.type === 'LOCAL_GUIDE')
  if (!currentDay) {
    return (
      <div className="min-h-screen bg-[#f0f2f8] pb-24">
        <TopBar title={tour.title} subtitle="ยังไม่มีกำหนดการ" backHref="/home" />
        <BottomNav activeTab="today" tourId={tourId} isChina={tour.isChina} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f2f8] pb-24 relative overflow-hidden">
      {/* Global styles */}
      <style>{`
        @keyframes gradientDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressGlow {
          from { width: 0%; }
        }
        @keyframes drawPath {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        .stagger-1 { animation: staggerIn 0.5s ease-out 0.08s both; }
        .stagger-2 { animation: staggerIn 0.5s ease-out 0.16s both; }
        .stagger-3 { animation: staggerIn 0.5s ease-out 0.24s both; }
        .stagger-4 { animation: staggerIn 0.5s ease-out 0.32s both; }
        .stagger-5 { animation: staggerIn 0.5s ease-out 0.40s both; }
        .stagger-6 { animation: staggerIn 0.5s ease-out 0.48s both; }
        .stagger-7 { animation: staggerIn 0.5s ease-out 0.56s both; }
        .flight-path { stroke-dasharray: 1; animation: drawPath 0.6s ease-out 0.4s both; }

        /* Desktop 2-column grid */
        @media (min-width: 900px) {
          .today-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            max-width: 1100px;
            margin-left: auto;
            margin-right: auto;
            padding-left: 32px;
            padding-right: 32px;
            align-items: start;
          }
          .today-grid-left,
          .today-grid-right {
            min-width: 0;
          }
          /* Hide mobile-only single-column sections on desktop */
          .mobile-only { display: none; }
        }
        @media (max-width: 899px) {
          /* On mobile, left/right cols just stack normally */
          .today-grid-left,
          .today-grid-right {
            /* no special styling */
          }
          /* Hide desktop-only grid wrapper behavior — let it be a plain div */
          .desktop-only { display: none; }
        }
      `}</style>

      {/* Ambient background — soft warm-cool drifting gradient (larger on desktop to fill sides) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] min-[900px]:w-[900px] min-[900px]:h-[900px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, #ede9f6 0%, transparent 70%)',
            animation: 'gradientDrift 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] min-[900px]:w-[850px] min-[900px]:h-[850px] rounded-full opacity-50"
          style={{
            background: 'radial-gradient(circle, #e8eaf2 0%, transparent 70%)',
            animation: 'gradientDrift 20s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute top-[35%] left-[40%] w-[400px] h-[400px] min-[900px]:w-[700px] min-[900px]:h-[700px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, #f0ecf8 0%, transparent 70%)',
            animation: 'gradientDrift 25s ease-in-out infinite 5s',
          }}
        />
        {/* Extra desktop-only gradient on the right side */}
        <div
          className="hidden min-[900px]:block absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full opacity-35"
          style={{
            background: 'radial-gradient(circle, #e4e0f0 0%, transparent 70%)',
            animation: 'gradientDrift 22s ease-in-out infinite 3s',
          }}
        />
      </div>

      <TopBar
        title={currentDay.title}
        subtitle={`${countryFlags[currentDay.country ?? ''] ?? '🌍'} ${currentDay.city ?? ''} · ${new Date(currentDay.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        backHref="/home"
      />

      <div className="relative z-10 px-4 min-[900px]:px-0 pt-5 page-content today-grid">
        {/* ══ LEFT COLUMN: Trip overview ══ */}
        <div className="today-grid-left space-y-5">
          {/* Tour info + countdown */}
          {isBeforeTrip ? (
            <PreTripCountdown
              tour={tour}
              currentDay={currentDay}
              daysUntilTrip={daysUntilTrip}
              tripStart={tripStart}
            />
          ) : (
            <div className={`${glassBg} ${glassCard} overflow-hidden stagger-1`}>
              <div className="px-7 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{countryFlags[tour.countries[0] ?? ''] ?? '🌍'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${primaryText}`}>{tour.title}</p>
                    <div className={`flex items-center gap-2 mt-1 text-[11px] ${secondaryText}`}>
                      <span>{tour.days[0]?.city ?? ''}</span>
                      <span className="opacity-40">·</span>
                      <span>{tour.days.length} วัน</span>
                      <span className="opacity-40">·</span>
                      <span>{tour.members.length} คน</span>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg flex-shrink-0 ml-2 border border-emerald-200/60 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  วันที่ {currentDay.dayNumber}/{tour.days.length}
                </span>
              </div>
            </div>
          )}

          {/* Weather forecast */}
          <div className="stagger-2">
            <SectionHeader label={`พยากรณ์อากาศ · ${tour.days[0]?.city ?? ''}`} />
            <WeatherSection
              weatherLoading={weatherLoading}
              weatherTooFar={weatherTooFar}
              weatherDays={weatherDays}
              tour={tour}
            />
          </div>

          {/* Guide + contacts */}
          {(guide || tour.contacts.length > 0) && (
            <div className="stagger-4">
              <SectionHeader label={`ผู้ติดต่อ (${tour.contacts.length})`} />
              <div className={`${glassBg} ${glassCard} overflow-hidden`}>
                {tour.contacts.map((c, i) => (
                  <div key={c.id}>
                    {i > 0 && <div className="h-px bg-[rgba(0,0,0,0.07)]" style={{ marginLeft: '74px' }} />}
                    <ContactCard contact={c} isChina={tour.isChina} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transports — during trip (left col on desktop) */}
          {!isBeforeTrip && currentDay.transports.length > 0 && (
            <div className="stagger-5">
              <SectionHeader label="การเดินทางวันนี้" />
              <div className={`${glassBg} ${glassCard} overflow-hidden`}>
                {currentDay.transports.map((t, i) => (
                  <div key={t.id}>
                    {i > 0 && <div className={sectionDivider} />}
                    <div className="px-7 py-5 flex items-start gap-4">
                      <span className="text-2xl mt-0.5">{transportIcons[t.type] ?? '🚗'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium text-sm ${primaryText}`}>{t.from} → {t.to}</p>
                          {t.duration && <span className={`text-xs ${secondaryText}`}>{t.duration}</span>}
                        </div>
                        {(t.fromLocal || t.toLocal) && (
                          <p className={`text-xs mt-1 ${secondaryText}`}>{t.fromLocal ?? t.from} → {t.toLocal ?? t.to}</p>
                        )}
                        {(t.departTime || t.arriveTime) && (
                          <p className={`text-xs mt-1.5 ${primaryText} opacity-60`}>
                            {t.departTime && `ออก ${t.departTime}`}
                            {t.departTime && t.arriveTime && ' · '}
                            {t.arriveTime && `ถึง ${t.arriveTime}`}
                          </p>
                        )}
                        {t.lineName && <p className="text-xs text-violet-600 mt-1">{t.lineName}{t.lineNameLocal && ` (${t.lineNameLocal})`}</p>}
                        {t.notes && <p className={`text-xs mt-1 ${secondaryText}`}>{t.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>{/* end left column */}

        {/* ══ RIGHT COLUMN: Flights + secondary content ══ */}
        <div className="today-grid-right space-y-5">
          {/* Pre-trip: flights */}
          {isBeforeTrip && tour.flights.length > 0 && (
            <div className="space-y-4 stagger-3">
              <SectionHeader label={`เที่ยวบิน (${tour.flights.length})`} />
              {tour.flights.map((f, idx) => (
                <FlightCard key={f.id} flight={f} index={idx} />
              ))}
            </div>
          )}

        {/* Announcements / Activities / Checklists */}
        {isBeforeTrip && announcements.length > 0 ? (
          <div className="stagger-5">
            <SectionHeader label="ประกาศจากผู้จัดทัวร์" />
            <AnnouncementCarousel announcements={announcements} onImageClick={setLightboxSrc} />
          </div>
        ) : isBeforeTrip && checklists.length > 0 ? (
          <div className="space-y-4 stagger-5">
            <SectionHeader label="เตรียมตัวก่อนออกเดินทาง" />
            {checklists.map(cl => {
              const checkedCount = cl.items.filter(item => item.checks.some(c => c.userId === userId)).length
              const totalCount = cl.items.length
              const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0
              return (
                <div key={cl.id} className={`${glassBg} ${glassCard} overflow-hidden`}>
                  <div className="px-7 py-4 flex items-center justify-between border-b border-[rgba(0,0,0,0.06)]">
                    <h3 className={`font-semibold text-sm ${primaryText}`}>
                      {cl.emoji && <span className="mr-1.5">{cl.emoji}</span>}
                      {cl.title}
                    </h3>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      checkedCount === totalCount && totalCount > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : `${secondaryText} bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.06)]`
                    }`}>
                      {checkedCount === totalCount && totalCount > 0 ? '✓' : `${checkedCount}/${totalCount}`}
                    </span>
                  </div>
                  {totalCount > 0 && (
                    <div className="mx-7 mt-4 mb-1 h-1.5 bg-[rgba(0,0,0,0.04)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7c5cfc] to-[#4fc3f7] transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          boxShadow: '0 0 10px rgba(124,92,252,0.25)',
                          animation: `progressGlow 1.5s cubic-bezier(0.22,1,0.36,1) both`,
                        }}
                      />
                    </div>
                  )}
                  <div>
                    {cl.items.map((item, i) => {
                      const isChecked = item.checks.some(c => c.userId === userId)
                      return (
                        <div key={item.id}>
                          {i > 0 && <div className="mx-7 h-px bg-[rgba(0,0,0,0.04)]" />}
                          <button
                            onClick={() => toggleCheck(item.id, isChecked)}
                            className="w-full flex items-center gap-3.5 px-7 py-3.5 text-left transition-colors duration-150 active:bg-[rgba(0,0,0,0.02)]"
                            style={{ minHeight: '44px' }}
                          >
                            <div className={`w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                              isChecked
                                ? 'bg-[#7c5cfc] border-[#7c5cfc]'
                                : 'border-[rgba(30,30,60,0.2)]'
                            }`}>
                              {isChecked && <span className="text-[#f8f8fc] text-[10px]">✓</span>}
                            </div>
                            <span className={`text-sm flex-1 ${
                              isChecked ? `${secondaryText} opacity-50 line-through` : primaryText
                            } ${item.isImportant ? 'font-medium' : ''}`}>
                              {item.label}
                              {item.isImportant && <span className="text-red-500 ml-0.5">*</span>}
                            </span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={`${glassBg} ${glassCard} overflow-hidden stagger-5`}>
            <div className="px-7 py-4 border-b border-[rgba(0,0,0,0.06)]">
              <h3 className={`font-semibold text-sm ${primaryText}`}>กำหนดการวันนี้ ({currentDay.activities.length})</h3>
            </div>
            {currentDay.activities.length === 0 ? (
              <p className={`text-sm text-center py-10 ${secondaryText}`}>ยังไม่มีกิจกรรม</p>
            ) : (
              <div className="px-7 py-5 space-y-5">
                {currentDay.activities.map((activity, i) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${categoryColors[activity.category] ?? 'bg-gray-400'}`} />
                      {i < currentDay.activities.length - 1 && <div className="w-px bg-[rgba(0,0,0,0.08)] flex-1 mt-1 min-h-[20px]" />}
                    </div>
                    <div className="pb-5 flex-1 min-w-0">
                      {activity.time && <p className={`text-xs mb-1 text-violet-600 ${accentGlow}`}>{activity.time}</p>}

                      {(activity.imageUrls ?? []).length > 0 && (
                        <div className="mb-3 flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                          {(activity.imageUrls ?? []).map((src, j) => (
                            <div key={j} className="flex-shrink-0 rounded-xl overflow-hidden w-44 h-28 relative border border-[rgba(0,0,0,0.06)]">
                              <Image src={src} alt="" fill className="object-cover" unoptimized />
                            </div>
                          ))}
                        </div>
                      )}

                      <p className={`text-sm font-semibold ${primaryText}`}>
                        {categoryIcons[activity.category]} {activity.title}
                      </p>
                      {activity.titleLocal && <p className={`text-xs mt-1 ${secondaryText}`}>{activity.titleLocal}</p>}
                      {activity.titleEn && !activity.titleLocal && <p className={`text-xs mt-1 ${secondaryText}`}>{activity.titleEn}</p>}

                      {activity.locationName && <p className={`text-xs mt-1.5 ${secondaryText}`}>📍 {activity.locationName}</p>}

                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                        {activity.durationMins && <p className={`text-xs ${secondaryText}`}>⏱️ {activity.durationMins} นาที</p>}
                        {activity.costTHB && (
                          <p className={`text-xs ${secondaryText}`}>
                            💰 ≈ ฿{activity.costTHB.toLocaleString()}
                            {activity.cost && activity.costCurrency && ` (${activity.costCurrency} ${activity.cost})`}
                          </p>
                        )}
                      </div>

                      {activity.description && <p className={`text-xs mt-2 leading-relaxed ${secondaryText}`}>{activity.description}</p>}

                      {activity.tips && (
                        <div className="mt-2.5 bg-amber-50/80 border border-amber-200/40 rounded-xl p-3">
                          <p className="text-xs text-amber-800">💡 {activity.tips}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accommodation — during trip */}
        {!isBeforeTrip && currentDay.accommodation && (
          <div className={`${glassBg} ${glassCard} overflow-hidden stagger-6`}>
            {currentDay.accommodation.imageUrl ? (
              <div className="w-full h-40 relative">
                <Image src={currentDay.accommodation.imageUrl} alt={currentDay.accommodation.name} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(26,26,46,0.7)] via-[rgba(26,26,46,0.2)] to-transparent" />
                <div className="absolute bottom-4 left-7 right-7">
                  <h3 className="text-[#f0f0ff] font-bold drop-shadow-md">{currentDay.accommodation.name}</h3>
                  {currentDay.accommodation.nameLocal && <p className="text-[rgba(255,255,255,0.7)] text-xs drop-shadow-md">{currentDay.accommodation.nameLocal}</p>}
                </div>
              </div>
            ) : (
              <div className="px-7 py-4 border-b border-[rgba(0,0,0,0.06)]">
                <h3 className={`font-semibold text-sm ${primaryText}`}>🏨 ที่พักคืนนี้</h3>
              </div>
            )}
            <div className="px-7 py-5 space-y-3">
              {!currentDay.accommodation.imageUrl && (
                <>
                  <p className={`font-semibold ${primaryText}`}>{currentDay.accommodation.name}</p>
                  {currentDay.accommodation.nameLocal && <p className={`text-xs ${secondaryText}`}>{currentDay.accommodation.nameLocal}</p>}
                </>
              )}
              {(currentDay.accommodation.checkIn || currentDay.accommodation.checkOut) && (
                <div className={`flex gap-5 text-xs ${secondaryText}`}>
                  {currentDay.accommodation.checkIn && <span>เช็คอิน: <span className={primaryText}>{currentDay.accommodation.checkIn}</span></span>}
                  {currentDay.accommodation.checkOut && <span>เช็คเอาต์: <span className={primaryText}>{currentDay.accommodation.checkOut}</span></span>}
                </div>
              )}
              {currentDay.accommodation.phone && (
                <a href={`tel:${currentDay.accommodation.phone}`} className="inline-flex items-center text-xs text-violet-600">📞 {currentDay.accommodation.phone}</a>
              )}
              {currentDay.accommodation.wifiName && (
                <div className="bg-sky-50/80 border border-sky-200/40 rounded-xl p-4 mt-1">
                  <p className="text-xs text-sky-700 font-medium mb-1.5">📶 WiFi</p>
                  <p className={`text-sm font-semibold ${primaryText}`}>{currentDay.accommodation.wifiName}</p>
                  {currentDay.accommodation.wifiPassword && <p className={`text-xs mt-0.5 ${secondaryText}`}>{currentDay.accommodation.wifiPassword}</p>}
                </div>
              )}
            </div>
          </div>
        )}

          {/* Inline CTA — bottom of right column */}
          <a
            href={`/tour/${tourId}/day/${currentDay.dayNumber}`}
            className="group flex items-center justify-center w-full h-14 rounded-2xl no-btn-fx mt-2 mb-4 transition-all duration-200 hover:-translate-y-px hover:bg-[rgba(255,255,255,0.75)] active:scale-[0.985] active:brightness-[0.97]"
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px) saturate(160%)',
              WebkitBackdropFilter: 'blur(16px) saturate(160%)',
              borderTop: '1px solid rgba(255,255,255,0.85)',
              borderLeft: '1px solid rgba(255,255,255,0.85)',
              borderBottom: '1px solid rgba(180,180,210,0.35)',
              borderRight: '1px solid rgba(180,180,210,0.35)',
              boxShadow: '0 2px 12px rgba(100,80,180,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(100,80,180,0.13), inset 0 1px 0 rgba(255,255,255,0.9)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(100,80,180,0.08), inset 0 1px 0 rgba(255,255,255,0.9)' }}
          >
            <span className="text-[#3d3a5c] font-semibold text-[15px]">ดูรายละเอียดเต็ม วันที่ {currentDay.dayNumber}</span>
            <span className="text-[#7c5cfc] text-[16px] ml-2 transition-transform duration-200 group-hover:translate-x-[3px]">→</span>
          </a>
        </div>{/* end right column */}
      </div>

      {/* Image lightbox */}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      <BottomNav activeTab="today" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}

// ── Sub-components ──

function WeatherSection({ weatherLoading, weatherTooFar, weatherDays, tour }: {
  weatherLoading: boolean
  weatherTooFar: boolean
  weatherDays: WeatherDay[]
  tour: TourData
}) {
  if (weatherLoading) {
    return (
      <div className={`${glassBg} ${glassCard} p-7 flex items-center justify-center gap-3`}>
        <div className="w-4 h-4 border-2 border-violet-400/60 border-t-transparent rounded-full animate-spin" />
        <span className={`text-xs ${secondaryText}`}>กำลังโหลดพยากรณ์อากาศ...</span>
      </div>
    )
  }
  if (weatherTooFar) {
    return (
      <div className={`${glassBg} ${glassCard} p-6 flex items-center gap-4`}>
        <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center flex-shrink-0 text-xl">🌤️</div>
        <div>
          <p className={`text-sm font-medium ${primaryText}`}>พยากรณ์จะพร้อมเมื่อใกล้วันเดินทาง</p>
          <p className={`text-xs mt-1 ${secondaryText}`}>
            ข้อมูลจะแสดงใน 3 วันก่อนวันที่ {new Date(tour.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
    )
  }
  if (weatherDays.length === 0) return null
  return (
    <div className={`${glassBg} ${glassCard} overflow-hidden`}>
      <div className={`grid ${weatherDays.length === 1 ? 'grid-cols-1' : weatherDays.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {weatherDays.slice(0, 3).map((w, i) => {
          const matchDay = tour.days.find(d => {
            const dd = new Date(d.date); dd.setHours(0, 0, 0, 0)
            const wd = new Date(w.date); wd.setHours(0, 0, 0, 0)
            return dd.getTime() === wd.getTime()
          })
          const dayLabel = matchDay
            ? `วันที่ ${matchDay.dayNumber}`
            : new Date(w.date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' })
          const dateStr = new Date(w.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })

          return (
            <div key={w.date} className={`p-5 text-center ${i > 0 ? 'border-l border-[rgba(0,0,0,0.06)]' : ''} ${i === 0 ? 'bg-[rgba(255,255,255,0.3)]' : ''}`}>
              <p className={`text-[11px] font-bold mb-0.5 ${i === 0 ? 'text-violet-600' : secondaryText}`}>{dayLabel}</p>
              <p className={`text-[10px] mb-3 ${secondaryText} opacity-70`}>{dateStr}</p>
              <p className="text-3xl mb-2">{w.icon}</p>
              <p className={`text-[11px] mb-2.5 truncate ${secondaryText}`}>{w.desc}</p>
              <div className="flex items-center justify-center gap-1.5">
                <span className={`text-sm font-bold ${primaryText}`}>{w.maxTemp}°</span>
                <span className="text-xs text-[rgba(30,30,60,0.2)]">/</span>
                <span className={`text-sm ${secondaryText}`}>{w.minTemp}°</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-[#7c5cfc] to-[#4fc3f7]" />
      <p className={`text-xs font-bold uppercase tracking-wider ${headerText}`}>{label}</p>
    </div>
  )
}

function PreTripCountdown({ tour, currentDay, daysUntilTrip, tripStart }: {
  tour: TourData
  currentDay: TourData['days'][0]
  daysUntilTrip: number
  tripStart: Date
}) {
  const animatedCount = useCountUp(daysUntilTrip)

  const totalDays = Math.max(1, Math.ceil((tripStart.getTime() - new Date(Date.now() - 30 * 86400000).getTime()) / 86400000))
  const elapsed = totalDays - daysUntilTrip
  const pct = Math.min(100, Math.max(5, (elapsed / totalDays) * 100))

  return (
    <div className={`${glassBg} ${glassCard} overflow-hidden stagger-1`}>
      {/* Tour title strip */}
      <div className="px-7 py-5 flex items-center justify-between border-b border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200/50 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">{countryFlags[tour.countries[0] ?? ''] ?? '🌍'}</span>
          </div>
          <div className="min-w-0">
            <p className={`font-bold text-sm truncate ${primaryText}`}>{tour.title}</p>
            <div className={`flex items-center gap-2 mt-1 text-[11px] ${secondaryText}`}>
              <span>{new Date(tour.startDate).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              <span className="opacity-40">·</span>
              <span>{tour.days[0]?.city ?? ''}</span>
              <span className="opacity-40">·</span>
              <span>{tour.members.length} คน</span>
            </div>
          </div>
        </div>
        <span className={`text-[11px] font-semibold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-lg flex-shrink-0 ml-2 border border-violet-200/60`}>
          เตรียมตัวเดินทาง
        </span>
      </div>

      {/* Countdown */}
      <div className="px-7 py-7">
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${secondaryText}`}>ออกเดินทางอีก</p>
        <div className="mt-3 flex items-end gap-2">
          <span
            className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#7c5cfc] via-[#6366f1] to-[#4fc3f7] ${accentGlow}`}
            style={{ fontSize: '96px', lineHeight: '1', fontFeatureSettings: '"tnum"' }}
          >
            {animatedCount}
          </span>
          <span className={`text-lg font-medium pb-3 ${secondaryText}`}>วัน</span>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="h-1.5 bg-[rgba(0,0,0,0.04)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7c5cfc] via-[#6366f1] to-[#4fc3f7] transition-all duration-[2000ms] ease-out"
              style={{
                width: `${pct}%`,
                boxShadow: '0 0 10px rgba(124,92,252,0.25)',
                animation: `progressGlow 1.5s cubic-bezier(0.22,1,0.36,1) both`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function FlightCard({ flight: f, index }: { flight: Flight; index: number }) {
  const depart = new Date(f.departAt)
  const arrive = new Date(f.arriveAt)
  const durationMs = arrive.getTime() - depart.getTime()
  const hours = Math.floor(durationMs / 3600000)
  const mins = Math.floor((durationMs % 3600000) / 60000)
  const getUtcOffset = (tz: string) => {
    const d = new Date()
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(d)
    const offsetStr = parts.find(p => p.type === 'timeZoneName')?.value ?? ''
    return offsetStr.replace('GMT', 'UTC')
  }
  const departUtc = getUtcOffset(f.departTz)
  const arriveUtc = getUtcOffset(f.arriveTz)

  return (
    <div
      className={`${glassBg} ${glassCard} overflow-hidden`}
      style={{ animation: `staggerIn 0.5s ease-out ${0.24 + index * 0.08}s both` }}
    >
      <div className="px-7 py-7">
        {/* Airline + flight no */}
        <div className="flex items-center gap-3.5 mb-5">
          {f.airlineIata ? (
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.75)] border border-[rgba(255,255,255,0.9)] flex items-center justify-center flex-shrink-0 p-1.5 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <Image src={`https://pics.avs.io/80/80/${f.airlineIata}.png`} alt={f.airline} width={40} height={40} className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xl">✈️</span>' }} unoptimized />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200/50 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">✈️</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-[15px] font-bold ${flightNumColor} ${accentGlow}`}>{f.flightNo}</p>
            <p className={`text-xs ${secondaryText}`}>{f.airline}</p>
          </div>
          <span className={`text-xs font-medium ${secondaryText}`}>{hours}h {mins}m</span>
        </div>

        {/* Route — departure left, arrival right */}
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <p className={`text-2xl font-bold tracking-tight ${primaryText} ${accentGlow}`}>
              {depart.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: f.departTz })}
            </p>
            <p className={`text-xs font-semibold mt-1 ${primaryText} opacity-60`}>{f.fromIata}</p>
          </div>

          {/* SVG arc path */}
          <div className="flex-1 mx-4 relative" style={{ height: '32px' }}>
            <svg viewBox="0 0 200 32" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M 8 24 Q 100 -4 192 24"
                fill="none"
                stroke="rgba(100,80,200,0.2)"
                strokeWidth="0.8"
                pathLength="1"
                className="flight-path"
              />
              {/* Plane icon at center of arc */}
              <g transform="translate(96, 6)">
                <path
                  d="M4 0L6 3H10L7 5.5L8 9L4 7L0 9L1 5.5L-2 3H2L4 0Z"
                  fill="rgba(124,92,252,0.6)"
                  transform="rotate(0, 4, 4.5)"
                />
              </g>
              {/* Departure dot */}
              <circle cx="8" cy="24" r="2.5" fill="none" stroke="rgba(124,92,252,0.4)" strokeWidth="1" />
              {/* Arrival dot */}
              <circle cx="192" cy="24" r="2.5" fill="rgba(124,92,252,0.5)" />
            </svg>
          </div>

          <div className="flex-shrink-0 text-right">
            <p className={`text-2xl font-bold tracking-tight ${primaryText} ${accentGlow}`}>
              {arrive.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: f.arriveTz })}
            </p>
            <p className={`text-xs font-semibold mt-1 ${primaryText} opacity-60`}>{f.toIata}</p>
          </div>
        </div>

        {/* Info row */}
        <div className={sectionDivider.replace('mx-6', 'mx-0')} style={{ marginTop: '20px', marginBottom: '16px' }} />
        <div className={`flex items-center gap-3 text-[11px] ${secondaryText}`}>
          <span>{depart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
          {f.terminal && <><span className="opacity-40">·</span><span>Terminal {f.terminal}</span></>}
          {f.gate && <><span className="opacity-40">·</span><span>Gate {f.gate}</span></>}
          <span className={`ml-auto ${secondaryText}`}>{departUtc} → {arriveUtc}</span>
        </div>
      </div>
    </div>
  )
}

function ContactCard({ contact: c }: { contact: TourData['contacts'][0]; isChina?: boolean }) {
  const typeIcon = c.type === 'THAI_GUIDE' ? '🇹🇭' : c.type === 'LOCAL_GUIDE' ? '🗺️' : c.type === 'HOTEL' ? '🏨' : c.type === 'EMERGENCY' ? '🚨' : c.type === 'AIRLINE' ? '✈️' : c.type === 'BUS_OPERATOR' ? '🚌' : c.type === 'RESTAURANT' ? '🍽️' : c.type === 'INSURANCE' ? '🛡️' : '👤'
  const typeLabel = c.type === 'THAI_GUIDE' ? 'ไกด์ไทย' : c.type === 'LOCAL_GUIDE' ? 'ไกด์ท้องถิ่น' : c.type === 'HOTEL' ? 'โรงแรม' : c.type === 'EMERGENCY' ? 'ฉุกเฉิน' : c.type === 'AIRLINE' ? 'สายการบิน' : c.type === 'BUS_OPERATOR' ? 'รถบัส' : c.type === 'RESTAURANT' ? 'ร้านอาหาร' : c.type === 'INSURANCE' ? 'ประกัน' : 'ติดต่อ'

  const avatarGradient = c.type === 'THAI_GUIDE'
    ? 'from-indigo-100 to-violet-100 border-indigo-200/50'
    : c.type === 'LOCAL_GUIDE'
    ? 'from-emerald-100 to-teal-100 border-emerald-200/50'
    : c.type === 'HOTEL'
    ? 'from-violet-100 to-purple-100 border-violet-200/50'
    : 'from-gray-50 to-gray-100 border-gray-200/50'

  const iconBtn = 'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-110 transition-transform no-btn-fx'

  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient} border flex items-center justify-center flex-shrink-0`}>
        <span className="text-lg">{typeIcon}</span>
      </div>

      {/* Name + role/phone */}
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-semibold truncate whitespace-nowrap ${primaryText}`}>{c.name}</p>
        <p className="text-[13px] mt-0.5 whitespace-nowrap truncate text-[rgba(0,0,0,0.4)]">
          {typeLabel}{c.phone && ` · ${c.phone}`}
        </p>
      </div>

      {/* Action icon buttons */}
      <div className="flex flex-row gap-2 flex-shrink-0">
        {c.phone && (
          <a href={`tel:${c.phone}`} className={`${iconBtn} bg-[rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.1)]`} title="โทร">
            <svg className="w-[18px] h-[18px] text-[#1a1a2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </a>
        )}
        {c.line && (
          <a href={`line://ti/p/~${c.line}`} className={`${iconBtn} bg-[rgba(6,199,85,0.12)] hover:bg-[rgba(6,199,85,0.2)]`} title="LINE">
            <span className="text-[14px] font-black text-[#06C755] leading-none">L</span>
          </a>
        )}
        {c.wechat && (
          <button onClick={() => navigator.clipboard.writeText(c.wechat!)} className={`${iconBtn} bg-[rgba(7,193,96,0.12)] hover:bg-[rgba(7,193,96,0.2)]`} title="WeChat">
            <span className="text-[12px] font-black text-[#07C160] leading-none">微</span>
          </button>
        )}
        {c.whatsapp && (
          <a href={`https://wa.me/${c.whatsapp.replace(/[^0-9+]/g, '')}`} className={`${iconBtn} bg-[rgba(37,211,102,0.12)] hover:bg-[rgba(37,211,102,0.2)]`} title="WhatsApp">
            <span className="text-[13px] font-black text-[#25D366] leading-none">W</span>
          </a>
        )}
      </div>
    </div>
  )
}

function AnnouncementCarousel({ announcements, onImageClick }: {
  announcements: Announcement[]
  onImageClick: (src: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // IntersectionObserver to track active dot
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement)
            if (idx >= 0) setActiveIdx(idx)
          }
        }
      },
      { root: container, threshold: 0.6 }
    )
    cardRefs.current.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [announcements.length])

  return (
    <div className="relative overflow-hidden -mx-4 min-[900px]:mx-0">
      {/* Scroll track */}
      <div
        ref={scrollRef}
        className="ann-scroll flex flex-row overflow-x-auto overflow-y-hidden gap-3"
        style={{
          padding: '4px 20px 16px 20px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        <style>{`.ann-scroll::-webkit-scrollbar { display: none; }`}</style>
        {announcements.map((a, i) => (
          <AnnouncementCard
            key={a.id}
            ref={(el) => { cardRefs.current[i] = el }}
            announcement={a}
            onImageClick={onImageClick}
          />
        ))}
      </div>

      {/* Right fade edge */}
      <div
        className="absolute top-0 right-0 w-12 h-full pointer-events-none"
        style={{ background: 'linear-gradient(to left, #f0f2f8, transparent)' }}
      />

      {/* Dot pagination */}
      {announcements.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-1 pb-1">
          {announcements.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
              }}
              className="rounded-full transition-all duration-300 no-btn-fx"
              style={{
                height: '6px',
                width: i === activeIdx ? '20px' : '6px',
                backgroundColor: i === activeIdx ? '#7c5cfc' : 'rgba(0,0,0,0.15)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const AnnouncementCard = forwardRef<HTMLDivElement, {
  announcement: Announcement
  onImageClick: (src: string) => void
}>(function AnnouncementCard({ announcement: a, onImageClick }, ref) {
  const [expanded, setExpanded] = useState(false)
  const contentRef = useRef<HTMLParagraphElement>(null)
  const [needsClamp, setNeedsClamp] = useState(false)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    setNeedsClamp(el.scrollHeight > el.clientHeight + 2)
  }, [a.content, expanded])

  return (
    <div
      ref={ref}
      className={`${glassBg} ${glassCard} overflow-hidden flex-shrink-0 w-[80vw] max-w-[320px] min-[900px]:w-[340px] min-[900px]:max-w-[340px] ${a.isPinned ? 'ring-1 ring-amber-300/40' : ''}`}
      style={{ scrollSnapAlign: 'start' }}
    >
      {a.isPinned && <div className="h-px bg-gradient-to-r from-amber-400/50 to-orange-400/50" />}

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-[rgba(0,0,0,0.06)]">
        {a.isPinned && (
          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 border border-amber-200/60 flex-shrink-0">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            ปักหมุด
          </span>
        )}
        <div className="w-5 h-5 rounded-md bg-amber-50 border border-amber-200/50 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783M10.34 6.66a23.847 23.847 0 008.835-2.535" /></svg>
        </div>
        <h3 className={`text-sm font-semibold truncate min-w-0 flex-1 ${primaryText}`}>{a.title}</h3>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p
          ref={contentRef}
          className={`text-sm whitespace-pre-line ${secondaryText}`}
          style={{
            lineHeight: '1.65',
            ...(!expanded ? {
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            } : {}),
          }}
        >
          {a.content}
        </p>

        {(needsClamp || expanded) && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-1.5 text-[12px] font-medium text-[#5b3fde] hover:text-[#4832b8] transition-colors no-btn-fx"
          >
            {expanded ? 'ย่อ' : 'ดูเพิ่มเติม'}
          </button>
        )}

        {a.imageUrls.length > 0 && (
          <div className="mt-3 space-y-2">
            {a.imageUrls.map((url, i) => (
              <button
                key={i}
                onClick={() => onImageClick(url)}
                className="relative w-full rounded-lg overflow-hidden group no-btn-fx cursor-pointer block"
              >
                <img src={url} alt="" className="w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" style={{ maxHeight: '120px', borderRadius: '8px' }} />
                <span className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-[rgba(0,0,0,0.4)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3.5 h-3.5 text-[#f0f0ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="text-[12px] mt-3 text-[rgba(0,0,0,0.35)]">
          {new Date(a.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
})

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  const touchStartY = useRef<number | null>(null)

  const close = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 150)
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: closing ? 'lbOut 0.15s ease-in forwards' : 'lbIn 0.2s ease-out forwards',
      }}
      onClick={close}
      onTouchStart={(e) => { touchStartY.current = e.touches[0]?.clientY ?? null }}
      onTouchEnd={(e) => {
        if (touchStartY.current === null) return
        const dy = (e.changedTouches[0]?.clientY ?? 0) - touchStartY.current
        if (dy > 60) close()
        touchStartY.current = null
      }}
    >
      <style>{`
        @keyframes lbIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lbOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes lbImgIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes lbImgOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.92); } }
      `}</style>
      <button
        onClick={(e) => { e.stopPropagation(); close() }}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-[#f0f0ff] text-xl hover:bg-white/10 transition-colors z-10 no-btn-fx"
        style={{ minHeight: '40px', minWidth: '40px' }}
      >
        ✕
      </button>
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl"
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          objectFit: 'contain',
          animation: closing ? 'lbImgOut 0.15s ease-in forwards' : 'lbImgIn 0.2s ease-out forwards',
        }}
      />
    </div>
  )
}
