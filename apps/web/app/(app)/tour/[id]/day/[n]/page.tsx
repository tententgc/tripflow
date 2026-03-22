'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { useApi } from '@/lib/swr'

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
        className="mt-2 inline-flex items-center gap-1.5 bg-green-50/80 border border-green-100/60 rounded-lg px-3 py-1.5 text-xs text-green-700 font-medium"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
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
      className="mt-2 inline-flex items-center gap-1.5 bg-blue-50/80 border border-blue-100/60 rounded-lg px-3 py-1.5 text-xs text-blue-700 font-medium"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
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
  imageUrl: string | null
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
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷', VN: '🇻🇳',
  IT: '🇮🇹', GB: '🇬🇧', DE: '🇩🇪', SG: '🇸🇬', AU: '🇦🇺', MY: '🇲🇾', ID: '🇮🇩', TW: '🇹🇼', HK: '🇭🇰', IN: '🇮🇳', AE: '🇦🇪', TR: '🇹🇷', ES: '🇪🇸', CH: '🇨🇭', US: '🇺🇸', NZ: '🇳🇿',
}

const categoryLabels: Record<string, string> = {
  SIGHTSEEING: 'สถานที่', FOOD: 'อาหาร', TRANSPORT: 'เดินทาง',
  ACCOMMODATION: 'ที่พัก', SHOPPING: 'ช้อปปิ้ง', TEMPLE: 'วัด',
  NATURE: 'ธรรมชาติ', NIGHTLIFE: 'ไนท์ไลฟ์', PHOTOGRAPHY: 'ถ่ายรูป', OTHER: 'อื่นๆ',
}

const categoryColors: Record<string, string> = {
  SIGHTSEEING: 'bg-indigo-50/80 text-indigo-600 border-indigo-100/60',
  FOOD: 'bg-orange-50/80 text-orange-600 border-orange-100/60',
  TRANSPORT: 'bg-gray-50/80 text-gray-500 border-gray-100/60',
  ACCOMMODATION: 'bg-violet-50/80 text-violet-600 border-violet-100/60',
  SHOPPING: 'bg-pink-50/80 text-pink-600 border-pink-100/60',
  TEMPLE: 'bg-amber-50/80 text-amber-600 border-amber-100/60',
  NATURE: 'bg-emerald-50/80 text-emerald-600 border-emerald-100/60',
  NIGHTLIFE: 'bg-purple-50/80 text-purple-600 border-purple-100/60',
  PHOTOGRAPHY: 'bg-cyan-50/80 text-cyan-600 border-cyan-100/60',
}

const transportLabels: Record<string, string> = {
  FLIGHT: 'เครื่องบิน', TRAIN: 'รถไฟ', HIGHSPEED_TRAIN: 'รถไฟความเร็วสูง', SUBWAY: 'รถไฟใต้ดิน',
  BUS: 'รถบัส', TAXI: 'แท็กซี่', FERRY: 'เรือ', CABLE_CAR: 'กระเช้า', WALK: 'เดินเท้า', OTHER: 'อื่นๆ',
}


export default function DayDetailPage() {
  const params = useParams()
  const tourId = params.id as string
  const dayNum = parseInt(params.n as string)
  const { data: tour, isLoading: loading } = useApi<Tour>(`/api/tours/${tourId}`)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-indigo-50/20">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const day = tour?.days.find((d) => d.dayNumber === dayNum)

  if (!day || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-indigo-50/20">
        <p className="text-gray-400">ไม่พบข้อมูลวันนี้</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20 pb-24">
      <TopBar
        title={day.title}
        subtitle={`${countryFlags[day.country ?? ''] ?? ''} ${day.city ?? ''} · ${new Date(day.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        backHref={`/tour/${tourId}/itinerary`}
      />

      <div className="px-4 -mt-2 space-y-3">
        {/* Meal badges */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-4">
          <p className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider mb-2">มื้ออาหาร</p>
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${day.mealBreakfast ? 'bg-orange-50/80 text-orange-600 border-orange-100/60' : 'bg-gray-50/50 text-gray-300 border-gray-100/40 line-through'}`}>เช้า</span>
            <span className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${day.mealLunch ? 'bg-green-50/80 text-green-600 border-green-100/60' : 'bg-gray-50/50 text-gray-300 border-gray-100/40 line-through'}`}>กลางวัน</span>
            <span className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${day.mealDinner ? 'bg-violet-50/80 text-violet-600 border-violet-100/60' : 'bg-gray-50/50 text-gray-300 border-gray-100/40 line-through'}`}>เย็น</span>
          </div>
        </div>

        {/* Summary */}
        {day.summary && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{day.summary}</p>
          </div>
        )}

        {/* Transports */}
        {day.transports.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-indigo-100/30 bg-gradient-to-r from-indigo-50/50 to-violet-50/30">
              <h3 className="font-semibold text-indigo-700 text-sm">การเดินทาง</h3>
            </div>
            <div className="divide-y divide-indigo-50/50">
              {day.transports.map((t) => (
                <div key={t.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50/80 border border-indigo-100/60 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-900">{t.from} → {t.to}</p>
                        {t.duration && <span className="text-xs text-gray-400">{t.duration}</span>}
                      </div>
                      {(t.fromLocal || t.toLocal) && (
                        <p className="text-xs text-gray-400 mt-0.5">{t.fromLocal ?? t.from} → {t.toLocal ?? t.to}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[11px] px-2 py-0.5 bg-indigo-50/80 text-indigo-600 border border-indigo-100/60 rounded-md font-medium">
                          {transportLabels[t.type] ?? t.type}
                        </span>
                        {(t.departTime || t.arriveTime) && (
                          <span className="text-xs text-gray-500">
                            {t.departTime && `ออก ${t.departTime}`}
                            {t.departTime && t.arriveTime && ' · '}
                            {t.arriveTime && `ถึง ${t.arriveTime}`}
                          </span>
                        )}
                      </div>
                      {t.lineName && (
                        <p className="text-xs text-indigo-600 mt-1">
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
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-indigo-100/30 bg-gradient-to-r from-indigo-50/50 to-violet-50/30">
              <h3 className="font-semibold text-indigo-700 text-sm">กิจกรรม ({day.activities.length})</h3>
            </div>
            <div className="p-4 space-y-4">
              {day.activities.map((activity, i) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-violet-500" />
                    {i < day.activities.length - 1 && <div className="w-px bg-indigo-200/40 flex-1 mt-1 min-h-[20px]" />}
                  </div>
                  <div className="pb-4 flex-1 min-w-0">
                    {activity.time && <p className="text-[11px] text-indigo-500 font-semibold mb-0.5">{activity.time}</p>}

                    {/* Place images */}
                    {(activity.imageUrls ?? []).length > 0 && (
                      <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {(activity.imageUrls ?? []).map((src, idx) => (
                          <div key={idx} className="flex-shrink-0 rounded-xl overflow-hidden w-44 h-28 relative">
                            <Image src={src} alt="" fill className="object-cover" unoptimized />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                        {activity.titleLocal && (
                          <p className="text-xs text-gray-400 mt-0.5">{activity.titleLocal}</p>
                        )}
                        {activity.titleEn && !activity.titleLocal && (
                          <p className="text-xs text-gray-400 mt-0.5">{activity.titleEn}</p>
                        )}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md flex-shrink-0 font-medium border ${categoryColors[activity.category] ?? 'bg-gray-50/80 text-gray-500 border-gray-100/60'}`}>
                        {categoryLabels[activity.category] ?? activity.category.toLowerCase()}
                      </span>
                    </div>

                    {activity.locationName && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <svg className="w-3 h-3 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <p className="text-xs text-indigo-600/70">{activity.locationName}</p>
                      </div>
                    )}
                    {activity.addressLocal && (
                      <p className="text-xs text-gray-400 ml-4">{activity.addressLocal}</p>
                    )}

                    {/* Map link */}
                    {(activity.locationName || activity.titleLocal || activity.titleEn || activity.address) && (
                      <MapLink
                        query={activity.addressLocal ?? activity.address ?? activity.locationName ?? activity.titleLocal ?? activity.titleEn ?? activity.title}
                        isChina={tour.isChina}
                      />
                    )}

                    {activity.durationMins && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-violet-500/70">{activity.durationMins} นาที</p>
                      </div>
                    )}
                    {activity.costTHB && (
                      <p className="text-xs text-indigo-500/70 mt-0.5 ml-4">
                        ≈ ฿{activity.costTHB.toLocaleString()}
                        {activity.cost && activity.costCurrency && ` (${activity.costCurrency} ${activity.cost})`}
                      </p>
                    )}
                    {activity.description && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{activity.description}</p>}
                    {activity.tips && (
                      <div className="mt-2 bg-amber-50/60 backdrop-blur-sm rounded-xl border border-amber-100/60 p-2.5">
                        <p className="text-xs text-amber-800">{activity.tips}</p>
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
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden">
            {/* Hotel image */}
            {day.accommodation.imageUrl && (
              <div className="w-full h-40 relative">
                <Image src={day.accommodation.imageUrl} alt={day.accommodation.name} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-white font-bold text-sm drop-shadow-md">{day.accommodation.name}</h3>
                  {day.accommodation.nameLocal && <p className="text-white/80 text-xs drop-shadow-md">{day.accommodation.nameLocal}</p>}
                </div>
              </div>
            )}
            {!day.accommodation.imageUrl && (
              <div className="px-4 py-3 border-b border-indigo-100/30 bg-gradient-to-r from-indigo-50/50 to-violet-50/30">
                <h3 className="font-semibold text-indigo-700 text-sm">ที่พัก</h3>
              </div>
            )}
            <div className="p-4 space-y-2">
              {!day.accommodation.imageUrl && (
                <a
                  href={mapUrl(day.accommodation.nameLocal ?? day.accommodation.name, tour.isChina)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {day.accommodation.name}
                  <span className="text-xs text-indigo-400">↗</span>
                </a>
              )}
              {!day.accommodation.imageUrl && day.accommodation.nameLocal && <p className="text-xs text-gray-400">{day.accommodation.nameLocal}</p>}
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
                <a href={`tel:${day.accommodation.phone}`} className="inline-flex items-center gap-1 text-xs text-indigo-600">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  {day.accommodation.phone}
                </a>
              )}
              {day.accommodation.wifiName && (
                <div className="bg-indigo-50/60 backdrop-blur-sm rounded-xl border border-indigo-100/60 p-3 mt-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                    </svg>
                    <p className="text-xs text-indigo-600 font-medium">WiFi</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{day.accommodation.wifiName}</p>
                  {day.accommodation.wifiPassword && <p className="text-xs text-gray-500 font-mono mt-0.5">{day.accommodation.wifiPassword}</p>}
                </div>
              )}
              {day.accommodation.address && (
                <a
                  href={mapUrl(day.accommodation.addressLocal ?? day.accommodation.address, tour.isChina)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {day.accommodation.address}
                  <span className="text-indigo-400">↗</span>
                </a>
              )}
              {day.accommodation.addressLocal && (
                <a
                  href={mapUrl(day.accommodation.addressLocal, tour.isChina)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-gray-400 ml-4 hover:text-indigo-500 transition-colors"
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
            <Link href={`/tour/${tourId}/day/${dayNum - 1}`}
              className="flex-1 py-3 bg-white/80 backdrop-blur-xl rounded-2xl text-center text-sm text-indigo-600 border border-indigo-100/40 hover:bg-indigo-50/50 transition-all active:scale-[0.98] font-medium">
              ← วันที่ {dayNum - 1}
            </Link>
          )}
          {tour.days.some((d) => d.dayNumber === dayNum + 1) && (
            <Link href={`/tour/${tourId}/day/${dayNum + 1}`}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl text-center text-sm text-white font-semibold shadow-sm shadow-indigo-200/50 hover:brightness-105 transition-all active:scale-[0.98]">
              วันที่ {dayNum + 1} →
            </Link>
          )}
        </div>
      </div>

      <BottomNav activeTab="itinerary" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}
