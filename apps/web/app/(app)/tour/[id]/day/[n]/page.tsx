'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'

function mapUrl(query: string, isChina: boolean) {
  const q = encodeURIComponent(query)
  return isChina
    ? `https://www.amap.com/search?query=${q}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`
}

function MapLink({ query, isChina }: { query: string; isChina: boolean }) {
  const encodedQuery = encodeURIComponent(query)
  if (isChina) {
    return (
      <a
        href={`https://www.amap.com/search?query=${encodedQuery}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 text-xs text-green-700 font-medium"
      >
        <span>🗺️</span>
        <span>Amap (高德地图)</span>
        <span className="text-green-400">↗</span>
      </a>
    )
  }
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 text-xs text-blue-700 font-medium"
    >
      <span>🗺️</span>
      <span>Google Maps</span>
      <span className="text-blue-400">↗</span>
    </a>
  )
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
  address: string | null
  addressLocal: string | null
  phone: string | null
  checkIn: string | null
  checkOut: string | null
  wifiName: string | null
  wifiPassword: string | null
  confirmationNo: string | null
  notes: string | null
}

interface Day {
  id: string
  dayNumber: number
  date: string
  title: string
  city: string | null
  country: string | null
  summary: string | null
  isChina: boolean
  mealBreakfast: boolean
  mealLunch: boolean
  mealDinner: boolean
  activities: Activity[]
  transports: Transport[]
  accommodation: Accommodation | null
}

interface Tour {
  id: string
  title: string
  isChina: boolean
  days: Day[]
}

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷',
  IT: '🇮🇹', GB: '🇬🇧', DE: '🇩🇪', SG: '🇸🇬', AU: '🇦🇺',
}

const categoryIcons: Record<string, string> = {
  SIGHTSEEING: '🏛️', FOOD: '🍜', TRANSPORT: '🚌',
  ACCOMMODATION: '🏨', SHOPPING: '🛍️', TEMPLE: '⛩️',
  NATURE: '🌿', NIGHTLIFE: '🌃', PHOTOGRAPHY: '📷', OTHER: '📍',
}

const categoryColors: Record<string, string> = {
  SIGHTSEEING: 'bg-blue-100 text-blue-700',
  FOOD: 'bg-orange-100 text-orange-700',
  TRANSPORT: 'bg-gray-100 text-gray-600',
  ACCOMMODATION: 'bg-violet-100 text-violet-700',
  SHOPPING: 'bg-pink-100 text-pink-700',
  TEMPLE: 'bg-yellow-100 text-yellow-700',
  NATURE: 'bg-green-100 text-green-700',
}

const transportIcons: Record<string, string> = {
  FLIGHT: '✈️', TRAIN: '🚂', HIGHSPEED_TRAIN: '🚄', SUBWAY: '🚇',
  BUS: '🚌', TAXI: '🚕', FERRY: '⛴️', CABLE_CAR: '🚡', WALK: '🚶', OTHER: '🚗',
}


export default function DayDetailPage() {
  const params = useParams()
  const tourId = params.id as string
  const dayNum = parseInt(params.n as string)
  const [tour, setTour] = useState<Tour | null>(null)
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

  const day = tour?.days.find((d) => d.dayNumber === dayNum)

  if (!day || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">ไม่พบข้อมูลวันนี้</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar
        title={day.title}
        subtitle={`${countryFlags[day.country ?? ''] ?? '🌍'} ${day.city ?? ''} · ${new Date(day.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        backHref={`/tour/${tourId}/itinerary`}
        gradient={tour.isChina ? 'bg-gradient-to-br from-red-600 to-red-800' : undefined}
      />

      <div className="px-4 -mt-2 space-y-3">
        {/* Meal badges */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 mb-2">อาหาร</p>
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${day.mealBreakfast ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-300 line-through'}`}>🍳 เช้า</span>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${day.mealLunch ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-300 line-through'}`}>🍱 กลางวัน</span>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${day.mealDinner ? 'bg-violet-50 text-violet-700' : 'bg-gray-50 text-gray-300 line-through'}`}>🍽️ เย็น</span>
          </div>
        </div>

        {/* Summary */}
        {day.summary && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed">{day.summary}</p>
          </div>
        )}

        {/* Transports */}
        {day.transports.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
              <h3 className="font-semibold text-indigo-700 text-sm">การเดินทาง</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {day.transports.map((t) => (
                <div key={t.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{transportIcons[t.type] ?? '🚗'}</span>
                    <div className="flex-1">
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
                      {t.lineName && (
                        <p className="text-xs text-indigo-600 mt-0.5">
                          {t.lineName}{t.lineNameLocal && ` (${t.lineNameLocal})`}
                        </p>
                      )}
                      {t.notes && <p className="text-xs text-gray-500 mt-1">{t.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities */}
        {day.activities.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
              <h3 className="font-semibold text-indigo-700 text-sm">กิจกรรม ({day.activities.length})</h3>
            </div>
            <div className="p-4 space-y-4">
              {day.activities.map((activity, i) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 bg-indigo-500" />
                    {i < day.activities.length - 1 && <div className="w-0.5 bg-gray-100 flex-1 mt-1 min-h-[20px]" />}
                  </div>
                  <div className="pb-4 flex-1 min-w-0">
                    {activity.time && <p className="text-xs text-gray-400 mb-0.5">{activity.time}</p>}

                    {/* Place images — horizontal scroll gallery */}
                    {(activity.imageUrls ?? []).length > 0 && (
                      <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {(activity.imageUrls ?? []).map((src, i) => (
                          <div key={i} className="flex-shrink-0 rounded-xl overflow-hidden w-44 h-28">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {categoryIcons[activity.category]} {activity.title}
                        </p>
                        {activity.titleLocal && (
                          <p className="text-xs text-gray-400 mt-0.5">{activity.titleLocal}</p>
                        )}
                        {activity.titleEn && !activity.titleLocal && (
                          <p className="text-xs text-gray-400 mt-0.5">{activity.titleEn}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${categoryColors[activity.category] ?? 'bg-gray-100 text-gray-500'}`}>
                        {activity.category.toLowerCase()}
                      </span>
                    </div>

                    {activity.locationName && (
                      <p className="text-xs text-gray-500 mt-1">📍 {activity.locationName}</p>
                    )}
                    {activity.addressLocal && (
                      <p className="text-xs text-gray-400">{activity.addressLocal}</p>
                    )}

                    {/* Map link (compact) */}
                    {(activity.locationName || activity.titleLocal || activity.titleEn || activity.address) && (
                      <MapLink
                        query={activity.addressLocal ?? activity.address ?? activity.locationName ?? activity.titleLocal ?? activity.titleEn ?? activity.title}
                        isChina={tour.isChina}
                      />
                    )}

                    {activity.durationMins && <p className="text-xs text-gray-400 mt-1.5">⏱️ {activity.durationMins} นาที</p>}
                    {activity.costTHB && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        💰 ≈ ฿{activity.costTHB.toLocaleString()}
                        {activity.cost && activity.costCurrency && ` (${activity.costCurrency} ${activity.cost})`}
                      </p>
                    )}
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
          </div>
        )}

        {/* Accommodation */}
        {day.accommodation && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
              <h3 className="font-semibold text-indigo-700 text-sm">🏨 ที่พัก</h3>
            </div>
            <div className="p-4 space-y-2">
              <a
                href={mapUrl(day.accommodation.nameLocal ?? day.accommodation.name, tour.isChina)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {day.accommodation.name}
                <span className="text-xs text-indigo-400">↗</span>
              </a>
              {day.accommodation.nameLocal && <p className="text-xs text-gray-400">{day.accommodation.nameLocal}</p>}
              {(day.accommodation.checkIn || day.accommodation.checkOut) && (
                <div className="flex gap-4 text-xs text-gray-500">
                  {day.accommodation.checkIn && <span>เช็คอิน: {day.accommodation.checkIn}</span>}
                  {day.accommodation.checkOut && <span>เช็คเอาต์: {day.accommodation.checkOut}</span>}
                </div>
              )}
              {day.accommodation.confirmationNo && (
                <p className="text-xs text-gray-500">Confirmation: <span className="font-mono">{day.accommodation.confirmationNo}</span></p>
              )}
              {day.accommodation.phone && (
                <a href={`tel:${day.accommodation.phone}`} className="text-xs text-indigo-600">📞 {day.accommodation.phone}</a>
              )}
              {day.accommodation.wifiName && (
                <div className="bg-blue-50 rounded-xl p-3 mt-2">
                  <p className="text-xs text-blue-600 font-medium mb-1">📶 WiFi</p>
                  <p className="text-sm font-semibold text-gray-900">{day.accommodation.wifiName}</p>
                  {day.accommodation.wifiPassword && <p className="text-xs text-gray-500">{day.accommodation.wifiPassword}</p>}
                </div>
              )}
              {day.accommodation.address && (
                <a
                  href={mapUrl(day.accommodation.addressLocal ?? day.accommodation.address, tour.isChina)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 active:opacity-70"
                >
                  📍 {day.accommodation.address}
                  <span className="text-indigo-400">↗</span>
                </a>
              )}
              {day.accommodation.addressLocal && (
                <a
                  href={mapUrl(day.accommodation.addressLocal, tour.isChina)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  {day.accommodation.addressLocal}
                </a>
              )}
              <MapLink
                query={day.accommodation.nameLocal ?? day.accommodation.name}
                isChina={tour.isChina}
              />
            </div>
          </div>
        )}

        {/* Day navigation */}
        <div className="flex gap-3">
          {dayNum > 1 && (
            <a href={`/tour/${tourId}/day/${dayNum - 1}`}
              className="flex-1 py-3 bg-white rounded-2xl text-center text-sm text-gray-600 border border-gray-100 shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-colors">
              ← วันที่ {dayNum - 1}
            </a>
          )}
          {tour.days.some((d) => d.dayNumber === dayNum + 1) && (
            <a href={`/tour/${tourId}/day/${dayNum + 1}`}
              className="flex-1 py-3 bg-white rounded-2xl text-center text-sm text-gray-600 border border-gray-100 shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-colors">
              วันที่ {dayNum + 1} →
            </a>
          )}
        </div>
      </div>

      <BottomNav activeTab="itinerary" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}
