'use client'

import { useState, useCallback, useEffect } from 'react'
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

    // wttr.in gives 3 days from today — check if trip overlaps
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
        // Only keep days that fall on or after trip start
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

  const toggleCheck = useCallback(async (itemId: string, currentlyChecked: boolean) => {
    if (!userId) return
    // Optimistic update
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

  // Weather hook — must be before any early returns
  const weatherCity = tour?.days?.[0]?.city ?? null
  const weatherStartDate = tour?.startDate ?? null
  const { days: weatherDays, loading: weatherLoading, tooFarAhead: weatherTooFar } = useWeather(weatherCity, weatherStartDate)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        {/* TopBar skeleton */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-4 pt-safe-top pb-5">
          <div className="flex items-center gap-3 pt-4">
            <div className="w-8 h-8 rounded-full bg-white/20" />
            <div className="flex-1">
              <div className="h-4 w-40 bg-white/30 rounded mb-1" />
              <div className="h-3 w-28 bg-white/15 rounded" />
            </div>
            <div className="w-9 h-9 rounded-full bg-white/20" />
          </div>
        </div>

        <div className="px-4 pt-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 h-16 border border-gray-100" />
          <div className="bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-3xl h-44" />
          <div className="bg-white rounded-3xl h-56 border border-gray-100" />
          <div className="bg-white rounded-2xl h-24 border border-gray-100" />
        </div>
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">ไม่พบทริปนี้</p>
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
      <div className="min-h-screen bg-gray-50 pb-24">
        <TopBar title={tour.title} subtitle="ยังไม่มีกำหนดการ" backHref="/home" />
        <BottomNav activeTab="today" tourId={tourId} isChina={tour.isChina} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 pb-24 relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed top-[-40px] right-[-30px] w-[280px] h-[280px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #a5b4fc 0%, transparent 70%)', opacity: 0.2, filter: 'blur(50px)' }} />
      <div className="fixed top-[35%] left-[-50px] w-[240px] h-[240px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #c4b5fd 0%, transparent 70%)', opacity: 0.25, filter: 'blur(50px)' }} />
      <div className="fixed bottom-[-50px] right-[-30px] w-[320px] h-[320px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', opacity: 0.15, filter: 'blur(60px)' }} />
      <div className="fixed bottom-[20%] left-[20%] w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #ddd6fe 0%, transparent 70%)', opacity: 0.3, filter: 'blur(45px)' }} />

      <TopBar
        title={currentDay.title}
        subtitle={`${countryFlags[currentDay.country ?? ''] ?? '🌍'} ${currentDay.city ?? ''} · ${new Date(currentDay.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        backHref="/home"
      />

      <div className="relative z-10 px-4 pt-4 space-y-4 page-content">
        {/* Tour info + countdown — merged */}
        {isBeforeTrip ? (
          <div className="bg-white/50 backdrop-blur-md rounded-2xl shadow-sm border border-indigo-200/40 overflow-hidden animate-slide-up delay-1">
            {/* Tour title — glass strip, not solid gradient */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-indigo-100/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200/40">
                  <span className="text-lg">{countryFlags[tour.countries[0] ?? ''] ?? '🌍'}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{tour.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                    <span>{new Date(tour.startDate).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span>·</span>
                    <span>{tour.days[0]?.city ?? ''}</span>
                    <span>·</span>
                    <span>{tour.members.length} คน</span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg flex-shrink-0 ml-2 border border-indigo-100">
                เตรียมตัวเดินทาง
              </span>
            </div>

            {/* Countdown */}
            <div className="p-5">
              <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">ออกเดินทางอีก</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600" style={{ fontFeatureSettings: '"tnum"' }}>
                  {daysUntilTrip}
                </span>
                <span className="text-lg font-medium text-gray-300 pb-1.5">วัน</span>
              </div>

              {/* Progress — animated */}
              {(() => {
                const totalDays = Math.max(1, Math.ceil((tripStart.getTime() - new Date(Date.now() - 30 * 86400000).getTime()) / 86400000))
                const elapsed = totalDays - daysUntilTrip
                const pct = Math.min(100, Math.max(5, (elapsed / totalDays) * 100))
                return (
                  <div className="mt-4">
                    <div className="h-2 bg-indigo-50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 transition-all duration-[2000ms] ease-out"
                        style={{ width: `${pct}%`, animation: 'progressGrow 1.5s cubic-bezier(0.22,1,0.36,1) both' }}
                      />
                    </div>
                    <style>{`@keyframes progressGrow { from { width: 0%; } to { width: ${pct}%; } }`}</style>
                  </div>
                )
              })()}
            </div>
          </div>
        ) : (
          /* During trip — just tour info */
          <div className="bg-white/50 backdrop-blur-md rounded-2xl shadow-sm border border-indigo-200/40 overflow-hidden animate-slide-up delay-1">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200/40">
                  <span className="text-lg">{countryFlags[tour.countries[0] ?? ''] ?? '🌍'}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{tour.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                    <span>{tour.days[0]?.city ?? ''}</span>
                    <span>·</span>
                    <span>{tour.days.length} วัน</span>
                    <span>·</span>
                    <span>{tour.members.length} คน</span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg flex-shrink-0 ml-2 border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                วันที่ {currentDay.dayNumber}/{tour.days.length}
              </span>
            </div>
          </div>
        )}

        {/* Weather forecast */}
        <div className="animate-slide-up delay-2">
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className="w-1.5 h-4 rounded-full bg-amber-500" />
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">พยากรณ์อากาศ · {tour.days[0]?.city ?? ''}</p>
          </div>

          {weatherLoading ? (
            <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-amber-200/30 shadow-sm p-6 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400">กำลังโหลดพยากรณ์อากาศ...</span>
            </div>
          ) : weatherTooFar ? (
            <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-amber-200/30 shadow-sm p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 text-xl">🌤️</div>
              <div>
                <p className="text-sm font-medium text-gray-700">พยากรณ์จะพร้อมเมื่อใกล้วันเดินทาง</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  ข้อมูลจะแสดงใน 3 วันก่อนวันที่ {new Date(tour.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          ) : weatherDays.length > 0 ? (
            <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-amber-200/30 shadow-sm overflow-hidden">
              <div className={`grid divide-x divide-amber-100/30 ${weatherDays.length === 1 ? 'grid-cols-1' : weatherDays.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {weatherDays.slice(0, 3).map((w, i) => {
                  // Match to tour day
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
                    <div key={w.date} className={`p-4 text-center ${i === 0 ? 'bg-amber-50/30' : ''}`}>
                      <p className={`text-[11px] font-bold mb-0.5 ${i === 0 ? 'text-amber-600' : 'text-gray-500'}`}>{dayLabel}</p>
                      <p className="text-[10px] text-gray-400 mb-2">{dateStr}</p>
                      <p className="text-3xl mb-1.5">{w.icon}</p>
                      <p className="text-[11px] text-gray-500 mb-2 truncate">{w.desc}</p>
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-sm font-bold text-gray-900">{w.maxTemp}°</span>
                        <span className="text-xs text-gray-300">/</span>
                        <span className="text-sm text-gray-400">{w.minTemp}°</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Pre-trip: flights */}
        {isBeforeTrip && (
          <>

            {tour.flights.length > 0 && (
              <div className="space-y-3 animate-slide-up delay-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-4 rounded-full bg-indigo-500" />
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">เที่ยวบิน ({tour.flights.length})</p>
                </div>
                {tour.flights.map((f) => {
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
                      <div key={f.id} className="bg-white/50 backdrop-blur-md rounded-2xl shadow-sm border border-indigo-100/40 p-5 hover:shadow-md transition-shadow duration-300">
                        {/* Airline + flight no */}
                        <div className="flex items-center gap-3 mb-4">
                          {f.airlineIata ? (
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 p-1">
                              <Image src={`https://pics.avs.io/80/80/${f.airlineIata}.png`} alt={f.airline} width={40} height={40} className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xl">✈️</span>' }} unoptimized />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-xl">✈️</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold text-gray-900">{f.flightNo}</p>
                            <p className="text-xs text-gray-400">{f.airline}</p>
                          </div>
                          <span className="text-xs text-gray-400 font-medium">{hours}h {mins}m</span>
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <p className="text-xl font-bold text-gray-900 tracking-tight">
                              {depart.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: f.departTz })}
                            </p>
                            <p className="text-xs font-semibold text-gray-700 mt-0.5">{f.fromIata}</p>
                          </div>

                          <div className="flex-1 flex items-center gap-1 px-1">
                            <div className="w-2 h-2 rounded-full border-[1.5px] border-indigo-300 flex-shrink-0" />
                            <div className="flex-1 h-[1px] bg-indigo-200" />
                            <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 -mx-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                            </svg>
                            <div className="flex-1 h-[1px] bg-indigo-200" />
                            <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                          </div>

                          <div className="flex-shrink-0 text-right">
                            <p className="text-xl font-bold text-gray-900 tracking-tight">
                              {arrive.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: f.arriveTz })}
                            </p>
                            <p className="text-xs font-semibold text-gray-700 mt-0.5">{f.toIata}</p>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-indigo-100/30 text-[11px] text-gray-400">
                          <span>{depart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                          {f.terminal && <><span>·</span><span>Terminal {f.terminal}</span></>}
                          {f.gate && <><span>·</span><span>Gate {f.gate}</span></>}
                          <span className="ml-auto text-gray-500">{departUtc} → {arriveUtc}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </>
        )}

        {/* Guide + contacts */}
        {(guide || tour.contacts.length > 0) && (
          <div className="space-y-3 animate-slide-up delay-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 rounded-full bg-emerald-500" />
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">ผู้ติดต่อ ({tour.contacts.length})</p>
            </div>
            {tour.contacts.map((c) => {
              const typeIcon = c.type === 'THAI_GUIDE' ? '🇹🇭' : c.type === 'LOCAL_GUIDE' ? '🗺️' : c.type === 'HOTEL' ? '🏨' : c.type === 'EMERGENCY' ? '🚨' : c.type === 'AIRLINE' ? '✈️' : c.type === 'BUS_OPERATOR' ? '🚌' : c.type === 'RESTAURANT' ? '🍽️' : c.type === 'INSURANCE' ? '🛡️' : '👤'
              const typeLabel = c.type === 'THAI_GUIDE' ? 'ไกด์ไทย' : c.type === 'LOCAL_GUIDE' ? 'ไกด์ท้องถิ่น' : c.type === 'HOTEL' ? 'โรงแรม' : c.type === 'EMERGENCY' ? 'ฉุกเฉิน' : c.type === 'AIRLINE' ? 'สายการบิน' : c.type === 'BUS_OPERATOR' ? 'รถบัส' : c.type === 'RESTAURANT' ? 'ร้านอาหาร' : c.type === 'INSURANCE' ? 'ประกัน' : 'ติดต่อ'
              // Language badges based on type
              const languages: string[] = []
              if (c.type === 'THAI_GUIDE') languages.push('🇹🇭 ไทย')
              if (c.type === 'LOCAL_GUIDE') languages.push('🌐 ท้องถิ่น')
              // Parse notes for language info (e.g. "พูดไทยได้" "speaks Thai")
              if (c.notes) {
                const n = c.notes.toLowerCase()
                if (n.includes('ไทย') || n.includes('thai')) languages.push('🇹🇭 ไทย')
                if (n.includes('อังกฤษ') || n.includes('english') || n.includes('eng')) languages.push('🇬🇧 อังกฤษ')
                if (n.includes('จีน') || n.includes('chinese') || n.includes('中文')) languages.push('🇨🇳 จีน')
                if (n.includes('ญี่ปุ่น') || n.includes('japanese') || n.includes('日本語')) languages.push('🇯🇵 ญี่ปุ่น')
                if (n.includes('เกาหลี') || n.includes('korean') || n.includes('한국어')) languages.push('🇰🇷 เกาหลี')
              }
              // Deduplicate
              const uniqueLangs = [...new Set(languages)]
              const gradientBg = c.type === 'THAI_GUIDE'
                ? 'from-indigo-100 to-violet-100 text-indigo-600'
                : c.type === 'LOCAL_GUIDE'
                ? 'from-emerald-100 to-teal-100 text-emerald-600'
                : c.type === 'HOTEL'
                ? 'from-violet-100 to-purple-100 text-violet-600'
                : 'from-gray-100 to-gray-200 text-gray-600'

              return (
                <div key={c.id} className="bg-white/50 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 border border-indigo-100/40 hover:border-indigo-200/60 transition-all duration-200">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientBg} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-lg">{typeIcon}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{typeLabel}{c.phone && ` · ${c.phone}`}</p>
                    {uniqueLangs.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {uniqueLangs.map(lang => (
                          <span key={lang} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium border border-amber-100/60">
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                    {c.notes && !uniqueLangs.length && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{c.notes}</p>
                    )}
                  </div>

                  {/* Action buttons — right side */}
                  <div className="flex gap-2 flex-shrink-0">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold active:scale-95 transition-transform border border-indigo-100"
                      >
                        <span>📞</span>
                        <span>โทร</span>
                      </a>
                    )}
                    {c.wechat && (
                      <button
                        onClick={() => navigator.clipboard.writeText(c.wechat!)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold active:scale-95 transition-transform border border-emerald-100"
                      >
                        <span className="font-black">微信</span>
                      </button>
                    )}
                    {c.line && (
                      <a
                        href={`line://ti/p/~${c.line}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-semibold active:scale-95 transition-transform border border-green-100"
                      >
                        <span className="font-black">LINE</span>
                      </a>
                    )}
                    {c.whatsapp && (
                      <a
                        href={`https://wa.me/${c.whatsapp.replace(/[^0-9+]/g, '')}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 text-teal-600 rounded-xl text-xs font-semibold active:scale-95 transition-transform border border-teal-100"
                      >
                        <span className="font-black">WA</span>
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Transports — only during trip */}
        {!isBeforeTrip && currentDay.transports.length > 0 && (
          <div className="bg-white/50 backdrop-blur-md rounded-2xl shadow-sm border border-indigo-100/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-indigo-100/30 bg-gradient-to-r from-indigo-50/50 to-violet-50/30">
              <h3 className="font-semibold text-indigo-700 text-sm">การเดินทางวันนี้</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {currentDay.transports.map((t) => (
                <div key={t.id} className="p-4 flex items-start gap-3">
                  <span className="text-2xl">{transportIcons[t.type] ?? '🚗'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-gray-900">{t.from} → {t.to}</p>
                      {t.duration && <span className="text-xs text-gray-400">{t.duration}</span>}
                    </div>
                    {(t.fromLocal || t.toLocal) && (
                      <p className="text-xs text-gray-400 mt-0.5">{t.fromLocal ?? t.from} → {t.toLocal ?? t.to}</p>
                    )}
                    {(t.departTime || t.arriveTime) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t.departTime && `ออก ${t.departTime}`}
                        {t.departTime && t.arriveTime && ' · '}
                        {t.arriveTime && `ถึง ${t.arriveTime}`}
                      </p>
                    )}
                    {t.lineName && <p className="text-xs text-indigo-600 mt-0.5">{t.lineName}{t.lineNameLocal && ` (${t.lineNameLocal})`}</p>}
                    {t.notes && <p className="text-xs text-gray-500 mt-1">{t.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Announcements from tour operator */}
        {announcements.length > 0 && (
          <div className="space-y-3 animate-slide-up delay-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 rounded-full bg-amber-500" />
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                  </svg>
                  ประกาศจากผู้จัดทัวร์
                </span>
              </p>
            </div>
            {announcements.map(a => (
              <div
                key={a.id}
                className={`bg-white/50 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden ${
                  a.isPinned
                    ? 'border-2 border-amber-200/60'
                    : 'border border-indigo-100/40'
                }`}
              >
                {a.isPinned && <div className="h-0.5 bg-gradient-to-r from-amber-400 to-orange-400" />}
                <div className="p-4">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {a.isPinned && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 flex-shrink-0">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            ปักหมุด
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-gray-900 truncate">{a.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{a.content}</p>

                      {/* Image gallery — horizontal scroll */}
                      {a.imageUrls.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
                          {a.imageUrls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt=""
                              className="w-28 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                            />
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-gray-400 mt-2">
                        {new Date(a.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Before trip: Preparation checklist / During trip: Today's activities */}
        {isBeforeTrip && checklists.length > 0 ? (
          <div className="space-y-3 animate-slide-up delay-5">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 rounded-full bg-violet-500" />
              <p className="text-xs text-violet-600 font-bold uppercase tracking-wider">เตรียมตัวก่อนออกเดินทาง</p>
            </div>
            {checklists.map(cl => {
              const checkedCount = cl.items.filter(item => item.checks.some(c => c.userId === userId)).length
              const totalCount = cl.items.length
              const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0
              return (
                <div key={cl.id} className="bg-white/50 backdrop-blur-md rounded-2xl border border-indigo-100/40 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100/60 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {cl.emoji && <span className="mr-1.5">{cl.emoji}</span>}
                      {cl.title}
                    </h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      checkedCount === totalCount && totalCount > 0
                        ? 'bg-emerald-500 text-white'
                        : 'text-gray-500 bg-gray-100'
                    }`}>
                      {checkedCount === totalCount && totalCount > 0 ? '✓' : `${checkedCount}/${totalCount}`}
                    </span>
                  </div>
                  {totalCount > 0 && (
                    <div className="mx-5 mt-3 mb-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  <div className="divide-y divide-gray-50">
                    {cl.items.map(item => {
                      const isChecked = item.checks.some(c => c.userId === userId)
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleCheck(item.id, isChecked)}
                          className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-150 active:bg-gray-50"
                          style={{ minHeight: '44px' }}
                        >
                          <div className={`w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            isChecked
                              ? 'bg-indigo-500 border-indigo-500'
                              : 'border-gray-300'
                          }`}>
                            {isChecked && <span className="text-white text-[10px]">✓</span>}
                          </div>
                          <span className={`text-sm flex-1 ${
                            isChecked ? 'text-gray-400 line-through' : 'text-gray-700'
                          } ${item.isImportant ? 'font-medium' : ''}`}>
                            {item.label}
                            {item.isImportant && <span className="text-red-500 ml-0.5">*</span>}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white/50 backdrop-blur-md rounded-2xl shadow-sm border border-indigo-100/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-indigo-100/30 bg-gradient-to-r from-indigo-50/50 to-violet-50/30">
              <h3 className="font-semibold text-indigo-700 text-sm">กำหนดการวันนี้ ({currentDay.activities.length})</h3>
            </div>
            {currentDay.activities.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">ยังไม่มีกิจกรรม</p>
            ) : (
              <div className="p-4 space-y-4">
                {currentDay.activities.map((activity, i) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${categoryColors[activity.category] ?? 'bg-gray-400'}`} />
                      {i < currentDay.activities.length - 1 && <div className="w-0.5 bg-gray-100 flex-1 mt-1 min-h-[20px]" />}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      {activity.time && <p className="text-xs text-gray-400 mb-0.5">{activity.time}</p>}

                      {/* Images */}
                      {(activity.imageUrls ?? []).length > 0 && (
                        <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          {(activity.imageUrls ?? []).map((src, j) => (
                            <div key={j} className="flex-shrink-0 rounded-xl overflow-hidden w-44 h-28 relative">
                              <Image src={src} alt="" fill className="object-cover" unoptimized />
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-sm font-semibold text-gray-900">
                        {categoryIcons[activity.category]} {activity.title}
                      </p>
                      {activity.titleLocal && <p className="text-xs text-gray-400 mt-0.5">{activity.titleLocal}</p>}
                      {activity.titleEn && !activity.titleLocal && <p className="text-xs text-gray-400 mt-0.5">{activity.titleEn}</p>}

                      {activity.locationName && <p className="text-xs text-gray-500 mt-1">📍 {activity.locationName}</p>}

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {activity.durationMins && <p className="text-xs text-gray-400">⏱️ {activity.durationMins} นาที</p>}
                        {activity.costTHB && (
                          <p className="text-xs text-gray-500">
                            💰 ≈ ฿{activity.costTHB.toLocaleString()}
                            {activity.cost && activity.costCurrency && ` (${activity.costCurrency} ${activity.cost})`}
                          </p>
                        )}
                      </div>

                      {activity.description && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{activity.description}</p>}

                      {activity.tips && (
                        <div className="mt-2 bg-yellow-50 rounded-xl p-2.5">
                          <p className="text-xs text-yellow-800">💡 {activity.tips}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accommodation — only during trip */}
        {!isBeforeTrip && currentDay.accommodation && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up delay-6">
            {currentDay.accommodation.imageUrl ? (
              <div className="w-full h-40 relative">
                <Image src={currentDay.accommodation.imageUrl} alt={currentDay.accommodation.name} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-white font-bold drop-shadow-md">{currentDay.accommodation.name}</h3>
                  {currentDay.accommodation.nameLocal && <p className="text-white/80 text-xs drop-shadow-md">{currentDay.accommodation.nameLocal}</p>}
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
                <h3 className="font-semibold text-indigo-700 text-sm">🏨 ที่พักคืนนี้</h3>
              </div>
            )}
            <div className="p-4 space-y-2">
              {!currentDay.accommodation.imageUrl && (
                <>
                  <p className="font-semibold text-gray-900">{currentDay.accommodation.name}</p>
                  {currentDay.accommodation.nameLocal && <p className="text-xs text-gray-400">{currentDay.accommodation.nameLocal}</p>}
                </>
              )}
              {(currentDay.accommodation.checkIn || currentDay.accommodation.checkOut) && (
                <div className="flex gap-4 text-xs text-gray-500">
                  {currentDay.accommodation.checkIn && <span>เช็คอิน: {currentDay.accommodation.checkIn}</span>}
                  {currentDay.accommodation.checkOut && <span>เช็คเอาต์: {currentDay.accommodation.checkOut}</span>}
                </div>
              )}
              {currentDay.accommodation.phone && (
                <a href={`tel:${currentDay.accommodation.phone}`} className="inline-flex items-center text-xs text-indigo-600">📞 {currentDay.accommodation.phone}</a>
              )}
              {currentDay.accommodation.wifiName && (
                <div className="bg-blue-50 rounded-xl p-3 mt-2">
                  <p className="text-xs text-blue-600 font-medium mb-1">📶 WiFi</p>
                  <p className="text-sm font-semibold text-gray-900">{currentDay.accommodation.wifiName}</p>
                  {currentDay.accommodation.wifiPassword && <p className="text-xs text-gray-500">{currentDay.accommodation.wifiPassword}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Link to full day detail */}
        <a
          href={`/tour/${tourId}/day/${currentDay.dayNumber}`}
          className="block text-center py-3 bg-indigo-50 rounded-2xl text-sm text-indigo-600 font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors duration-200 animate-slide-up delay-6"
        >
          ดูรายละเอียดเต็ม วันที่ {currentDay.dayNumber} →
        </a>
      </div>

      <BottomNav activeTab="today" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}
