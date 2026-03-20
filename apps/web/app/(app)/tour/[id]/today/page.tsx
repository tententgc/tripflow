'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetch(`/api/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => { setTour(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tourId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar
        title={currentDay.title}
        subtitle={`${countryFlags[currentDay.country ?? ''] ?? '🌍'} ${currentDay.city ?? ''} · ${new Date(currentDay.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        backHref="/home"
        gradient={tour.isChina ? 'bg-gradient-to-br from-red-600 to-red-800' : undefined}
      />

      <div className="px-4 -mt-2 space-y-3">
        {/* Tour info card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="font-semibold text-gray-900 text-sm">{tour.title}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            <span>{countryFlags[tour.countries[0] ?? ''] ?? '🌍'} {tour.days[0]?.city ?? ''} — {tour.days[tour.days.length - 1]?.city ?? ''}</span>
            <span>📅 {tour.days.length} วัน</span>
            <span>👥 {tour.members.length} คน</span>
            <span className="text-indigo-600 font-medium">วันที่ {currentDay.dayNumber}/{tour.days.length}</span>
          </div>
        </div>

        {/* Pre-trip: countdown + flights */}
        {isBeforeTrip && (
          <>
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
              <p className="text-white/70 text-xs font-medium">ออกเดินทางอีก</p>
              <p className="text-4xl font-bold mt-1">{daysUntilTrip} <span className="text-lg font-normal">วัน</span></p>
              <p className="text-white/60 text-xs mt-1">
                {new Date(tour.startDate).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {tour.flights.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-blue-50">
                  <h3 className="font-semibold text-sky-700 text-sm">✈️ เที่ยวบิน ({tour.flights.length})</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {tour.flights.map((f) => {
                    const depart = new Date(f.departAt)
                    const arrive = new Date(f.arriveAt)
                    const durationMs = arrive.getTime() - depart.getTime()
                    const hours = Math.floor(durationMs / 3600000)
                    const mins = Math.floor((durationMs % 3600000) / 60000)
                    return (
                      <div key={f.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            {f.airlineIata ? (
                              <img
                                src={`https://pics.avs.io/60/60/${f.airlineIata}.png`}
                                alt={f.airline}
                                className="w-9 h-9 rounded-lg object-contain bg-gray-50 p-0.5"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            ) : (
                              <span className="text-xl">✈️</span>
                            )}
                            <div>
                              <p className="text-sm font-bold text-gray-900">{f.flightNo}</p>
                              <p className="text-xs text-gray-400">{f.airline}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">{hours}h {mins}m</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-center flex-1">
                            <p className="text-2xl font-bold text-gray-900">
                              {depart.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: f.departTz })}
                            </p>
                            <p className="text-sm font-semibold text-gray-700 mt-0.5">{f.fromIata}</p>
                            <p className="text-xs text-gray-400">{f.fromAirport}</p>
                          </div>

                          <div className="flex-1 flex flex-col items-center px-2">
                            <div className="w-full flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full border-2 border-indigo-400" />
                              <div className="flex-1 border-t-2 border-dashed border-indigo-200" />
                              <span className="text-indigo-400 text-xs">✈</span>
                              <div className="flex-1 border-t-2 border-dashed border-indigo-200" />
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            </div>
                          </div>

                          <div className="text-center flex-1">
                            <p className="text-2xl font-bold text-gray-900">
                              {arrive.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: f.arriveTz })}
                            </p>
                            <p className="text-sm font-semibold text-gray-700 mt-0.5">{f.toIata}</p>
                            <p className="text-xs text-gray-400">{f.toAirport}</p>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-3 text-xs text-gray-500">
                          <span>📅 {depart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          {f.terminal && <span>🏢 Terminal {f.terminal}</span>}
                          {f.gate && <span>🚪 Gate {f.gate}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Guide + contacts */}
        {(guide || tour.contacts.length > 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
              <h3 className="font-semibold text-indigo-700 text-sm">ผู้ติดต่อ</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {tour.contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.type === 'THAI_GUIDE' ? 'ไกด์ไทย' : c.type === 'LOCAL_GUIDE' ? 'ไกด์ท้องถิ่น' : c.type === 'HOTEL' ? 'โรงแรม' : 'ติดต่อ'}
                      {c.phone && ` · ${c.phone}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm">📞</span>
                      </a>
                    )}
                    {tour.isChina && c.wechat && (
                      <button onClick={() => navigator.clipboard.writeText(c.wechat!)} className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">微信</span>
                      </button>
                    )}
                    {!tour.isChina && c.line && (
                      <a href={`line://ti/p/~${c.line}`} className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">LINE</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transports */}
        {currentDay.transports.length > 0 && (
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

        {/* Activities */}
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

        {/* Accommodation */}
        {currentDay.accommodation && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
              <h3 className="font-semibold text-indigo-700 text-sm">🏨 ที่พักคืนนี้</h3>
            </div>
            <div className="p-4 space-y-2">
              <p className="font-semibold text-gray-900">{currentDay.accommodation.name}</p>
              {currentDay.accommodation.nameLocal && <p className="text-xs text-gray-400">{currentDay.accommodation.nameLocal}</p>}
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
          className="block text-center py-3 bg-white rounded-2xl text-sm text-indigo-600 font-medium border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors"
        >
          ดูรายละเอียดเต็ม วันที่ {currentDay.dayNumber} →
        </a>
      </div>

      <BottomNav activeTab="today" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}
