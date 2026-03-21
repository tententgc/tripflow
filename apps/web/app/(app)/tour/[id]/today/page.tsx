'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'

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
  contacts: Array<{ id: string; name: string; phone: string | null; wechat: string | null; line: string | null; type: string }>
  members: Array<{ user: { name: string } }>
}

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷',
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
  const [tour, setTour] = useState<TourData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checklists, setChecklists] = useState<ChecklistData[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/tours/${tourId}`).then(r => r.json()),
      fetch(`/api/tours/${tourId}/checklist`).then(r => r.json()).catch(() => []),
      fetch('/api/auth/me').then(r => r.json()).catch(() => null),
    ]).then(([tourData, checklistData, userData]) => {
      setTour(tourData)
      setChecklists(Array.isArray(checklistData) ? checklistData : [])
      setUserId(userData?.id ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [tourId])

  const toggleCheck = useCallback(async (itemId: string, currentlyChecked: boolean) => {
    if (!userId) return
    // Optimistic update
    setChecklists(prev => prev.map(cl => ({
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
    })))

    await fetch(`/api/tours/${tourId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, userId, checked: !currentlyChecked }),
    })
  }, [userId, tourId])

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20 pb-24">
      <TopBar
        title={currentDay.title}
        subtitle={`${countryFlags[currentDay.country ?? ''] ?? '🌍'} ${currentDay.city ?? ''} · ${new Date(currentDay.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        backHref="/home"
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Tour info card */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-4 shadow-sm animate-slide-up delay-1 text-white">
          <p className="font-semibold text-[15px]">{tour.title}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
            <span>{countryFlags[tour.countries[0] ?? ''] ?? '🌍'} {tour.days[0]?.city ?? ''}</span>
            <span>·</span>
            <span>{tour.days.length} วัน</span>
            <span>·</span>
            <span>{tour.members.length} คน</span>
            <span className="ml-auto text-white/90 font-semibold text-[11px] bg-white/15 px-2 py-0.5 rounded-full">
              วันที่ {currentDay.dayNumber}/{tour.days.length}
            </span>
          </div>
        </div>

        {/* Pre-trip: countdown + flights */}
        {isBeforeTrip && (
          <>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-indigo-100/50 animate-slide-up delay-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-500 tracking-wide">ออกเดินทางอีก</p>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-5xl font-black tracking-tight text-gray-900" style={{ fontFeatureSettings: '"tnum"' }}>
                      {daysUntilTrip}
                    </span>
                    <span className="text-base font-medium text-gray-300">วัน</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(tour.startDate).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {countryFlags[tour.countries[0] ?? ''] ?? '🌍'}
                </div>
              </div>

              {/* Progress */}
              {(() => {
                const totalDays = Math.max(1, Math.ceil((tripStart.getTime() - new Date(Date.now() - 30 * 86400000).getTime()) / 86400000))
                const elapsed = totalDays - daysUntilTrip
                const pct = Math.min(100, Math.max(5, (elapsed / totalDays) * 100))
                return (
                  <div className="mt-4">
                    <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })()}
            </div>

            {tour.flights.length > 0 && (
              <div className="space-y-3 animate-slide-up delay-3">
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider px-1">✈️ เที่ยวบิน ({tour.flights.length})</p>
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
                      <div key={f.id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100/80 p-5 hover:shadow-md transition-shadow duration-300">
                        {/* Airline + flight no */}
                        <div className="flex items-center gap-3 mb-4">
                          {f.airlineIata ? (
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 p-1">
                              <img src={`https://pics.avs.io/80/80/${f.airlineIata}.png`} alt={f.airline} className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xl">✈️</span>' }} />
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
                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100/80 text-[11px] text-gray-400">
                          <span>{depart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                          {f.terminal && <><span>·</span><span>Terminal {f.terminal}</span></>}
                          {f.gate && <><span>·</span><span>Gate {f.gate}</span></>}
                          <span className="ml-auto text-gray-300">{departUtc} → {arriveUtc}</span>
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
            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider px-1">📋 ผู้ติดต่อ ({tour.contacts.length})</p>
            {tour.contacts.map((c) => {
              const typeIcon = c.type === 'THAI_GUIDE' ? '🇹🇭' : c.type === 'LOCAL_GUIDE' ? '🗺️' : c.type === 'HOTEL' ? '🏨' : '👤'
              const typeLabel = c.type === 'THAI_GUIDE' ? 'ไกด์ไทย' : c.type === 'LOCAL_GUIDE' ? 'ไกด์ท้องถิ่น' : c.type === 'HOTEL' ? 'โรงแรม' : 'ติดต่อ'
              const gradientBg = c.type === 'THAI_GUIDE'
                ? 'from-blue-500 to-indigo-600'
                : c.type === 'LOCAL_GUIDE'
                ? 'from-emerald-500 to-teal-600'
                : c.type === 'HOTEL'
                ? 'from-violet-500 to-purple-600'
                : 'from-gray-500 to-gray-600'

              return (
                <div key={c.id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100/80 p-4 flex items-center gap-3 hover:shadow-md transition-all duration-300">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradientBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <span className="text-lg">{typeIcon}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{typeLabel}{c.phone && ` · ${c.phone}`}</p>
                  </div>

                  {/* Action buttons — right side */}
                  <div className="flex gap-2 flex-shrink-0">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500 text-white rounded-xl text-xs font-semibold active:scale-95 transition-transform shadow-sm"
                      >
                        <span>📞</span>
                        <span>โทร</span>
                      </a>
                    )}
                    {tour.isChina && c.wechat && (
                      <button
                        onClick={() => navigator.clipboard.writeText(c.wechat!)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
                      >
                        <span className="font-black">微信</span>
                      </button>
                    )}
                    {!tour.isChina && c.line && (
                      <a
                        href={`line://ti/p/~${c.line}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
                      >
                        <span className="font-black">LINE</span>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
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

        {/* Before trip: Preparation checklist / During trip: Today's activities */}
        {isBeforeTrip && checklists.length > 0 ? (
          <div className="space-y-3 animate-slide-up delay-5">
            {checklists.map(cl => {
              const checkedCount = cl.items.filter(item => item.checks.some(c => c.userId === userId)).length
              const totalCount = cl.items.length
              const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0
              return (
                <div key={cl.id} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-green-200/30 blur-lg" />
                    <div className="flex items-center justify-between relative">
                      <h3 className="font-bold text-green-700 text-sm">
                        {cl.emoji && <span className="mr-1.5 text-base">{cl.emoji}</span>}
                        {cl.title}
                      </h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        checkedCount === totalCount && totalCount > 0
                          ? 'bg-green-500 text-white'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {checkedCount === totalCount && totalCount > 0 ? '✓ ครบแล้ว' : `${checkedCount}/${totalCount}`}
                      </span>
                    </div>
                    {totalCount > 0 && (
                      <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            checkedCount === totalCount
                              ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                              : 'bg-gradient-to-r from-green-400 to-teal-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {cl.items.map(item => {
                      const isChecked = item.checks.some(c => c.userId === userId)
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleCheck(item.id, isChecked)}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all duration-200 ${
                            isChecked ? 'bg-green-50/50' : 'active:bg-gray-50'
                          }`}
                          style={{ minHeight: '48px' }}
                        >
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            isChecked
                              ? 'bg-green-500 border-green-500 scale-110 shadow-sm shadow-green-200'
                              : 'border-gray-300 hover:border-green-400'
                          }`}>
                            {isChecked && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <span className={`text-sm flex-1 transition-all duration-200 ${
                            isChecked ? 'text-gray-400 line-through decoration-green-400' : 'text-gray-800'
                          } ${item.isImportant ? 'font-semibold' : ''}`}>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
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
                            <div key={j} className="flex-shrink-0 rounded-xl overflow-hidden w-44 h-28">
                              <img src={src} alt="" className="w-full h-full object-cover" />
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
                <img src={currentDay.accommodation.imageUrl} alt={currentDay.accommodation.name} className="w-full h-full object-cover" />
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
