'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { useApi } from '@/lib/swr'

// ── Map helpers ──
function mapUrl(query: string, isChina: boolean) {
  const q = encodeURIComponent(query)
  return isChina
    ? `https://www.amap.com/search?query=${q}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`
}

function MapLink({ query, isChina }: { query: string; isChina: boolean }) {
  const href = isChina
    ? `https://www.amap.com/search?query=${encodeURIComponent(query)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 inline-flex items-center gap-1.5 rounded-[20px] px-3 py-1.5 text-[12px] font-semibold text-[#1a1a2e] no-btn-fx transition-all hover:shadow-md"
      style={{
        background: 'rgba(255,255,255,0.6)',
        border: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      🗺 {isChina ? 'Amap (高德)' : 'Google Maps'} <span className="text-[rgba(30,30,60,0.3)]">↗</span>
    </a>
  )
}

// ── Thai day-of-week colors ──
const thaiDayColors = [
  '#ef4444', '#eab308', '#f472b6', '#22c55e', '#f97316', '#3b82f6', '#8b5cf6',
]
function getDayColor(dateStr: string): string {
  return thaiDayColors[new Date(dateStr).getDay()]!
}
function rgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// ── Interfaces ──
interface Activity {
  id: string; time: string | null; title: string; titleEn: string | null
  titleLocal: string | null; description: string | null; category: string
  locationName: string | null; address: string | null; addressLocal: string | null; googleMapUrl: string | null
  durationMins: number | null; cost: number | null; costCurrency: string | null
  costTHB: number | null; tips: string | null; imageUrls: string[]
}
interface Transport {
  id: string; type: string; from: string; fromLocal: string | null
  to: string; toLocal: string | null; departTime: string | null
  arriveTime: string | null; duration: string | null; lineName: string | null
  lineNameLocal: string | null; notes: string | null
}
interface Accommodation {
  name: string; nameLocal: string | null; address: string | null
  addressLocal: string | null; phone: string | null; checkIn: string | null
  checkOut: string | null; wifiName: string | null; wifiPassword: string | null
  confirmationNo: string | null; imageUrl: string | null; notes: string | null
}
interface Day {
  id: string; dayNumber: number; date: string; title: string
  city: string | null; country: string | null; summary: string | null
  isChina: boolean; mealBreakfast: boolean; mealLunch: boolean
  mealDinner: boolean; activities: Activity[]; transports: Transport[]
  accommodation: Accommodation | null
}
interface Tour { id: string; title: string; isChina: boolean; days: Day[] }

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷', VN: '🇻🇳',
  IT: '🇮🇹', GB: '🇬🇧', DE: '🇩🇪', SG: '🇸🇬', AU: '🇦🇺', MY: '🇲🇾',
  ID: '🇮🇩', TW: '🇹🇼', HK: '🇭🇰', IN: '🇮🇳', AE: '🇦🇪', TR: '🇹🇷',
  ES: '🇪🇸', CH: '🇨🇭', US: '🇺🇸', NZ: '🇳🇿',
}
const categoryLabels: Record<string, string> = {
  SIGHTSEEING: 'ท่องเที่ยว', FOOD: 'อาหาร', TRANSPORT: 'เดินทาง',
  ACCOMMODATION: 'ที่พัก', SHOPPING: 'ช้อปปิ้ง', TEMPLE: 'วัด',
  NATURE: 'ธรรมชาติ', NIGHTLIFE: 'ไนท์ไลฟ์', PHOTOGRAPHY: 'ถ่ายรูป', OTHER: 'อื่นๆ',
}
const transportLabels: Record<string, string> = {
  FLIGHT: 'เครื่องบิน', TRAIN: 'รถไฟ', HIGHSPEED_TRAIN: 'รถไฟความเร็วสูง',
  SUBWAY: 'รถไฟใต้ดิน', BUS: 'รถบัส', TAXI: 'แท็กซี่', FERRY: 'เรือ',
  CABLE_CAR: 'กระเช้า', WALK: 'เดินเท้า', OTHER: 'อื่นๆ',
}

// ── Glass tokens ──
const glass = {
  bg: 'rgba(255,255,255,0.62)',
  blur: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.88)',
  shadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 20px rgba(0,0,0,0.05)',
}
function glassStyle() {
  return {
    background: glass.bg,
    backdropFilter: glass.blur,
    WebkitBackdropFilter: glass.blur,
    border: glass.border,
    boxShadow: glass.shadow,
  } as const
}

// ── Main page ──
export default function DayDetailPage() {
  const params = useParams()
  const tourId = params.id as string
  const dayNum = parseInt(params.n as string)
  const { data: tour, isLoading: loading } = useApi<Tour>(`/api/tours/${tourId}`)
  const [lbImages, setLbImages] = useState<string[] | null>(null)
  const [lbIdx, setLbIdx] = useState(0)

  const openLightbox = useCallback((images: string[], startIdx: number) => {
    setLbImages(images)
    setLbIdx(startIdx)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
        <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const day = tour?.days.find((d) => d.dayNumber === dayNum)
  if (!day || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
        <p className="text-[rgba(30,30,60,0.4)]">ไม่พบข้อมูลวันนี้</p>
      </div>
    )
  }

  const hex = getDayColor(day.date)
  let sectionIdx = 0
  const delay = () => `${(sectionIdx++) * 0.06}s`

  return (
    <div className="min-h-screen bg-[#f0f2f8] relative overflow-hidden" style={{ paddingBottom: '100px' }}>
      <style>{`
        @keyframes dayCardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dayBarIn {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
      `}</style>

      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #ede9f6 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #e8eaf2 0%, transparent 70%)' }} />
      </div>

      <TopBar
        title={day.title}
        subtitle={`${countryFlags[day.country ?? ''] ?? ''} ${day.city ?? ''} · ${new Date(day.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        backHref={`/tour/${tourId}/itinerary`}
      />

      <div className="relative z-10 px-4 pt-4 max-w-[680px] mx-auto space-y-3">

        {/* ═══ SUMMARY + MEALS ═══ */}
        <GlassCard hex={hex} delay={delay()}>
          <SectionLabel>มื้ออาหาร</SectionLabel>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {day.mealBreakfast && <MealTag hex={hex} emoji="🌅" label="เช้า" />}
            {day.mealLunch && <MealTag hex={hex} emoji="🍱" label="กลางวัน" />}
            {day.mealDinner && <MealTag hex={hex} emoji="🌙" label="เย็น" />}
            {!day.mealBreakfast && !day.mealLunch && !day.mealDinner && (
              <span className="text-[12px] text-[rgba(30,30,60,0.3)]">ไม่มีมื้ออาหารรวม</span>
            )}
          </div>
          {day.summary && (
            <p className="text-[14px] text-[rgba(30,30,60,0.7)] mt-4" style={{ lineHeight: '1.7' }}>{day.summary}</p>
          )}
        </GlassCard>

        {/* ═══ TRANSPORTS ═══ */}
        {day.transports.length > 0 && (
          <GlassCard hex={hex} delay={delay()}>
            <SectionLabel>การเดินทาง</SectionLabel>
            <div className="mt-3 space-y-3">
              {day.transports.map((t) => (
                <div key={t.id} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: rgba(hex, 0.1), border: `1px solid ${rgba(hex, 0.2)}` }}>
                    <svg className="w-[18px] h-[18px]" style={{ color: hex }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1a1a2e]">{t.from} → {t.to}</p>
                    {(t.fromLocal || t.toLocal) && (
                      <p className="text-[12px] text-[rgba(30,30,60,0.4)] mt-0.5">{t.fromLocal ?? t.from} → {t.toLocal ?? t.to}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-[20px] font-semibold" style={{ background: rgba(hex, 0.1), border: `1px solid ${rgba(hex, 0.2)}`, color: hex }}>
                        {transportLabels[t.type] ?? t.type}
                      </span>
                      {(t.departTime || t.arriveTime) && (
                        <span className="text-[12px] text-[rgba(30,30,60,0.4)]">
                          {t.departTime && `ออก ${t.departTime}`}
                          {t.departTime && t.arriveTime && ' · '}
                          {t.arriveTime && `ถึง ${t.arriveTime}`}
                        </span>
                      )}
                    </div>
                    {t.lineName && <p className="text-[12px] mt-1" style={{ color: hex }}>{t.lineName}{t.lineNameLocal && ` (${t.lineNameLocal})`}</p>}
                    {t.notes && <p className="text-[12px] text-[rgba(30,30,60,0.4)] mt-1">{t.notes}</p>}
                  </div>
                  {t.duration && <span className="text-[13px] font-semibold flex-shrink-0 pt-0.5" style={{ color: hex }}>{t.duration}</span>}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* ═══ ACTIVITIES ═══ */}
        {day.activities.length > 0 && (
          <>
            <div className="px-1 mt-1" style={{ animation: `dayCardIn 0.32s ease-out ${delay()} both` }}>
              <SectionLabel>กิจกรรม ({day.activities.length})</SectionLabel>
            </div>
            {day.activities.map((activity, i) => {
              const d = delay()
              return (
                <div key={activity.id}>
                  <div className="rounded-[20px] overflow-hidden" style={{ ...glassStyle(), animation: `dayCardIn 0.32s ease-out ${d} both` }}>
                    {/* Header row — time badge + title inline */}
                    <div className="px-5 pt-4 pb-0 flex items-center gap-2.5 mb-3">
                      {activity.time && (
                        <span className="inline-flex items-center h-[26px] px-3 rounded-[20px] text-[12px] font-bold flex-shrink-0" style={{ background: rgba(hex, 0.1), border: `1px solid ${rgba(hex, 0.25)}`, color: hex }}>
                          {activity.time}
                        </span>
                      )}
                      <p className="text-[15px] font-bold text-[#1a1a2e] flex-1 min-w-0 truncate whitespace-nowrap">{activity.title}</p>
                      <span className="text-[10px] px-2.5 py-1 rounded-[20px] flex-shrink-0 font-semibold" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)', color: 'rgba(30,30,60,0.5)' }}>
                        {categoryLabels[activity.category] ?? activity.category.toLowerCase()}
                      </span>
                    </div>

                    {/* Images */}
                    {(activity.imageUrls ?? []).length > 0 && (
                      <ActivityImages images={activity.imageUrls} onOpen={openLightbox} />
                    )}

                    {/* Info */}
                    <div className="px-5 pb-5" style={{ paddingTop: (activity.imageUrls ?? []).length > 0 ? '12px' : '4px' }}>
                      {activity.titleLocal && <p className="text-[12px] text-[rgba(30,30,60,0.4)] mt-0.5">{activity.titleLocal}</p>}
                      {activity.titleEn && !activity.titleLocal && <p className="text-[12px] text-[rgba(30,30,60,0.4)] mt-0.5">{activity.titleEn}</p>}

                      {activity.locationName && (
                        activity.googleMapUrl ? (
                          <a href={activity.googleMapUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[13px] font-medium mt-2 flex items-center gap-1 hover:underline" style={{ color: hex }}>
                            📍 {activity.locationName} <span className="text-[10px] opacity-60">↗</span>
                          </a>
                        ) : (
                          <p className="text-[13px] font-medium mt-2" style={{ color: hex }}>📍 {activity.locationName}</p>
                        )
                      )}
                      {activity.addressLocal && <p className="text-[12px] text-[rgba(30,30,60,0.4)] mt-0.5 ml-5">{activity.addressLocal}</p>}

                      {activity.googleMapUrl ? (
                        <a href={activity.googleMapUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 ml-5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-blue-600 no-btn-fx"
                          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                          🗺️ Google Maps <span className="text-[10px]">↗</span>
                        </a>
                      ) : (activity.locationName || activity.address || activity.titleLocal || activity.titleEn) && (
                        <MapLink query={activity.addressLocal ?? activity.address ?? activity.locationName ?? activity.titleLocal ?? activity.titleEn ?? activity.title} isChina={tour.isChina} />
                      )}

                      {activity.description && (
                        <p className="text-[13px] text-[rgba(30,30,60,0.6)] mt-3" style={{ lineHeight: '1.7' }}>{activity.description}</p>
                      )}

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {activity.durationMins && <span className="text-[12px] text-[rgba(30,30,60,0.4)]">⏱ {activity.durationMins} นาที</span>}
                        {activity.costTHB && (
                          <span className="text-[12px] text-[rgba(30,30,60,0.4)]">
                            💰 ≈ ฿{activity.costTHB.toLocaleString()}
                            {activity.cost && activity.costCurrency && ` (${activity.costCurrency} ${activity.cost})`}
                          </span>
                        )}
                      </div>

                      {activity.tips && (
                        <div className="mt-3 rounded-xl p-3" style={{ background: rgba(hex, 0.06), border: `1px solid ${rgba(hex, 0.12)}` }}>
                          <p className="text-[12px]" style={{ color: rgba(hex, 1), lineHeight: '1.6' }}>💡 {activity.tips}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline connector */}
                  {i < day.activities.length - 1 && (
                    <div className="flex justify-center" style={{ height: '16px', margin: '-4px auto 0' }}>
                      <div className="w-px h-full" style={{ borderLeft: `1px dashed ${rgba(hex, 0.25)}` }} />
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* ═══ ACCOMMODATION ═══ */}
        {day.accommodation && (
          <GlassCard hex={hex} delay={delay()}>
            {day.accommodation.imageUrl && (
              <div className="w-full h-44 relative -mx-5 -mt-5 mb-4 rounded-t-[20px] overflow-hidden" style={{ width: 'calc(100% + 40px)' }}>
                <Image src={day.accommodation.imageUrl} alt={day.accommodation.name} fill className="object-cover" unoptimized />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,26,46,0.6), transparent 60%)' }} />
                <div className="absolute bottom-3 left-5 right-5">
                  <h3 className="text-[#f0f0ff] font-bold text-[15px] drop-shadow-md">{day.accommodation.name}</h3>
                  {day.accommodation.nameLocal && <p className="text-[rgba(255,255,255,0.7)] text-[12px] drop-shadow-md">{day.accommodation.nameLocal}</p>}
                </div>
              </div>
            )}
            <SectionLabel>ที่พัก</SectionLabel>
            {!day.accommodation.imageUrl && (
              <p className="text-[15px] font-bold text-[#1a1a2e] mt-2">{day.accommodation.name}</p>
            )}
            {!day.accommodation.imageUrl && day.accommodation.nameLocal && (
              <p className="text-[12px] text-[rgba(30,30,60,0.4)] mt-0.5">{day.accommodation.nameLocal}</p>
            )}
            {(day.accommodation.checkIn || day.accommodation.checkOut) && (
              <div className="flex gap-4 text-[12px] text-[rgba(30,30,60,0.4)] mt-2">
                {day.accommodation.checkIn && <span>เช็คอิน: <span className="text-[#1a1a2e] font-medium">{day.accommodation.checkIn}</span></span>}
                {day.accommodation.checkOut && <span>เช็คเอาต์: <span className="text-[#1a1a2e] font-medium">{day.accommodation.checkOut}</span></span>}
              </div>
            )}
            {day.accommodation.confirmationNo && (
              <p className="text-[12px] text-[rgba(30,30,60,0.4)] mt-1">Confirmation: <span className="font-mono text-[#1a1a2e]">{day.accommodation.confirmationNo}</span></p>
            )}
            {day.accommodation.phone && (
              <a href={`tel:${day.accommodation.phone}`} className="inline-flex items-center gap-1.5 text-[12px] mt-2 no-btn-fx" style={{ color: hex }}>
                📞 {day.accommodation.phone}
              </a>
            )}
            {day.accommodation.wifiName && (
              <div className="rounded-xl p-3 mt-3" style={{ background: rgba(hex, 0.06), border: `1px solid ${rgba(hex, 0.12)}` }}>
                <p className="text-[12px] font-medium mb-1" style={{ color: hex }}>📶 WiFi</p>
                <p className="text-[14px] font-semibold text-[#1a1a2e]">{day.accommodation.wifiName}</p>
                {day.accommodation.wifiPassword && <p className="text-[12px] text-[rgba(30,30,60,0.4)] font-mono mt-0.5">{day.accommodation.wifiPassword}</p>}
              </div>
            )}
            {(day.accommodation.address || day.accommodation.nameLocal) && (
              <MapLink query={day.accommodation.addressLocal ?? day.accommodation.address ?? day.accommodation.nameLocal ?? day.accommodation.name} isChina={tour.isChina} />
            )}
          </GlassCard>
        )}

        {/* ═══ DAY NAV ═══ */}
        <div className="flex gap-3" style={{ animation: `dayCardIn 0.32s ease-out ${delay()} both` }}>
          {dayNum > 1 && (
            <Link href={`/tour/${tourId}/day/${dayNum - 1}`}
              className="flex-1 h-12 flex items-center justify-center rounded-2xl text-[14px] font-semibold text-[#3d3a5c] no-btn-fx active:scale-[0.98] transition-all"
              style={glassStyle()}>
              ← วันที่ {dayNum - 1}
            </Link>
          )}
          {tour.days.some((d) => d.dayNumber === dayNum + 1) && (
            <Link href={`/tour/${tourId}/day/${dayNum + 1}`}
              className="flex-1 h-12 flex items-center justify-center rounded-2xl text-[14px] font-semibold text-[#f8f8fc] no-btn-fx active:scale-[0.98] transition-all"
              style={{ background: `linear-gradient(to right, ${hex}, ${rgba(hex, 0.7)})`, boxShadow: `0 4px 16px ${rgba(hex, 0.3)}` }}>
              วันที่ {dayNum + 1} →
            </Link>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lbImages && (
        <DayLightbox images={lbImages} startIdx={lbIdx} onClose={() => setLbImages(null)} />
      )}

      <BottomNav activeTab="itinerary" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}

// ── Sub-components ──

function GlassCard({ hex, delay, children }: { hex: string; delay: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[20px] relative overflow-hidden"
      style={{ ...glassStyle(), animation: `dayCardIn 0.32s ease-out ${delay} both` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: `linear-gradient(to bottom, ${hex}, ${rgba(hex, 0.25)})`, borderRadius: '4px 0 0 4px', transformOrigin: 'top', animation: `dayBarIn 0.4s ease-out ${delay} both` }} />
      <div className="p-5">{children}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase text-[rgba(30,30,60,0.4)]" style={{ letterSpacing: '0.08em' }}>{children}</p>
}

function MealTag({ hex, emoji, label }: { hex: string; emoji: string; label: string }) {
  return (
    <span className="inline-flex items-center h-[26px] px-3 rounded-[20px] text-[12px] font-semibold" style={{ background: rgba(hex, 0.1), border: `1px solid ${rgba(hex, 0.25)}`, color: hex }}>
      {emoji} {label}
    </span>
  )
}

function ActivityImages({ images, onOpen }: { images: string[]; onOpen: (imgs: string[], idx: number) => void }) {
  if (images.length === 1) {
    return (
      <div className="px-5 pt-3">
        <button onClick={() => onOpen(images, 0)} className="relative w-full rounded-[10px] overflow-hidden group no-btn-fx cursor-pointer block">
          <img src={images[0]} alt="" className="w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" style={{ maxHeight: '200px' }} />
          <ExpandOverlay />
        </button>
      </div>
    )
  }
  if (images.length === 2) {
    return (
      <div className="px-5 pt-3 grid grid-cols-2 gap-2">
        {images.map((src, i) => (
          <button key={i} onClick={() => onOpen(images, i)} className="relative rounded-[10px] overflow-hidden group no-btn-fx cursor-pointer">
            <img src={src} alt="" className="w-full h-[140px] object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
            <ExpandOverlay />
          </button>
        ))}
      </div>
    )
  }
  // 3+
  return (
    <div className="px-5 pt-3 space-y-2">
      <button onClick={() => onOpen(images, 0)} className="relative w-full rounded-[10px] overflow-hidden group no-btn-fx cursor-pointer block">
        <img src={images[0]} alt="" className="w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" style={{ maxHeight: '160px' }} />
        <ExpandOverlay />
      </button>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.slice(1).map((src, i) => (
          <button key={i} onClick={() => onOpen(images, i + 1)} className="relative flex-shrink-0 rounded-[10px] overflow-hidden group no-btn-fx cursor-pointer">
            <img src={src} alt="" className="w-28 h-[100px] object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
            <ExpandOverlay />
          </button>
        ))}
      </div>
    </div>
  )
}

function ExpandOverlay() {
  return (
    <span className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <svg className="w-3.5 h-3.5 text-[#f0f0ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    </span>
  )
}

function DayLightbox({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx)
  const [closing, setClosing] = useState(false)
  const touchStartY = useRef<number | null>(null)

  const close = useCallback(() => { setClosing(true); setTimeout(onClose, 160) }, [onClose])
  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIdx(i => Math.min(images.length - 1, i + 1)), [images.length])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [close, prev, next])

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  const arrowCls = 'absolute top-1/2 -translate-y-1/2 w-11 h-11 min-[900px]:w-[52px] min-[900px]:h-[52px] rounded-full flex items-center justify-center text-[#f0f0ff] no-btn-fx transition-all z-10'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', animation: closing ? 'lbOut .16s ease-in forwards' : 'lbIn .22s ease-out forwards' }}
      onClick={close}
      onTouchStart={(e) => { touchStartY.current = e.touches[0]?.clientY ?? null }}
      onTouchEnd={(e) => { if (touchStartY.current !== null && ((e.changedTouches[0]?.clientY ?? 0) - touchStartY.current) > 60) close(); touchStartY.current = null }}
    >
      <style>{`
        @keyframes lbIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lbOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes lbImgIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <button onClick={(e) => { e.stopPropagation(); close() }} className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full text-[#f0f0ff] text-xl no-btn-fx hover:bg-[rgba(255,255,255,0.1)] z-10" style={{ minHeight: '44px', minWidth: '44px' }}>✕</button>

      {/* Arrows */}
      {idx > 0 && (
        <button onClick={(e) => { e.stopPropagation(); prev() }} className={`${arrowCls} left-3`} style={{ background: 'rgba(255,255,255,0.1)' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      {idx < images.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); next() }} className={`${arrowCls} right-3`} style={{ background: 'rgba(255,255,255,0.1)' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      )}

      <img src={images[idx]} alt="" onClick={(e) => e.stopPropagation()} className="rounded-[14px]" style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', animation: 'lbImgIn .22s ease-out forwards' }} />

      {/* Counter */}
      {images.length > 1 && (
        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[#f0f0ff] text-[13px] font-medium" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          {idx + 1} / {images.length}
        </span>
      )}
    </div>
  )
}
