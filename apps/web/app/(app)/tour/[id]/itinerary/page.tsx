'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { useApi } from '@/lib/swr'

interface Accommodation {
  name: string
  imageUrl: string | null
  checkIn: string | null
  checkOut: string | null
}

interface Day {
  id: string
  dayNumber: number
  date: string
  title: string
  city: string | null
  country: string | null
  mealBreakfast: boolean
  mealLunch: boolean
  mealDinner: boolean
  accommodation: Accommodation | null
}

interface TourBasic {
  id: string
  title: string
  isChina: boolean
  days: Day[]
}

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷', VN: '🇻🇳',
  IT: '🇮🇹', GB: '🇬🇧', DE: '🇩🇪', SG: '🇸🇬', AU: '🇦🇺', MY: '🇲🇾', ID: '🇮🇩', TW: '🇹🇼', HK: '🇭🇰', IN: '🇮🇳', AE: '🇦🇪', TR: '🇹🇷', ES: '🇪🇸', CH: '🇨🇭', US: '🇺🇸', NZ: '🇳🇿',
}

// Thai day-of-week colors: Sun=red Mon=yellow Tue=pink Wed=green Thu=orange Fri=blue Sat=purple
const thaiDayColors = [
  '#ef4444', // อาทิตย์ — แดง
  '#eab308', // จันทร์ — เหลือง
  '#f472b6', // อังคาร — ชมพู
  '#22c55e', // พุธ — เขียว
  '#f97316', // พฤหัส — ส้ม
  '#3b82f6', // ศุกร์ — ฟ้า
  '#8b5cf6', // เสาร์ — ม่วง
]

function getDayColor(dateStr: string): string {
  const dow = new Date(dateStr).getDay() // 0=Sun … 6=Sat
  return thaiDayColors[dow]!
}

/** Returns inline style for element using day color at given opacity */
function colorBg(color: string, opacity: number) {
  // Parse hex → rgb
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return { r, g, b, rgba: (a: number) => `rgba(${r},${g},${b},${a})` }
}

export default function ItineraryPage() {
  const params = useParams()
  const tourId = params.id as string
  const { data: tour, isLoading: loading } = useApi<TourBasic>(`/api/tours/${tourId}?fields=basic`)

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#f0f2f8] relative overflow-hidden" style={{ paddingBottom: '100px' }}>
      <style>{`
        @keyframes itinCardIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes itinBarIn {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
      `}</style>

      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #ede9f6 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #e8eaf2 0%, transparent 70%)' }} />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #f0ecf8 0%, transparent 70%)' }} />
      </div>

      <TopBar title="แผนเที่ยว" subtitle={tour?.title ?? ''} backHref="/home" />

      <div className="relative z-10 px-4 py-4 max-w-[640px] mx-auto space-y-3">
        {!tour?.days.length ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{
                background: 'rgba(255,255,255,0.62)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.88)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <svg className="w-6 h-6 text-[rgba(30,30,60,0.25)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <p className="text-[rgba(30,30,60,0.4)] text-sm">ยังไม่มีกำหนดการ</p>
          </div>
        ) : (
          tour.days.map((day, idx) => {
            const hex = getDayColor(day.date)
            const c = colorBg(hex, 0)

            return (
              <Link
                key={day.id}
                href={`/tour/${tourId}/day/${day.dayNumber}`}
                className="block no-btn-fx"
                style={{ animation: `itinCardIn 0.35s ease-out ${idx * 0.07}s both` }}
              >
                <div
                  className="rounded-[20px] relative overflow-hidden active:scale-[0.99] transition-all duration-150 hover:-translate-y-px"
                  style={{
                    background: 'rgba(255,255,255,0.62)',
                    backdropFilter: 'blur(20px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                    border: '1px solid rgba(255,255,255,0.88)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 20px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{
                      background: `linear-gradient(to bottom, ${hex}, ${c.rgba(0.25)})`,
                      borderRadius: '4px 0 0 4px',
                      transformOrigin: 'top',
                      animation: `itinBarIn 0.4s ease-out ${idx * 0.07}s both`,
                    }}
                  />

                  {/* Inner wrapper */}
                  <div className="flex flex-col gap-3" style={{ padding: '18px 20px 18px 24px' }}>
                    {/* Header row */}
                    <div className="flex items-start gap-3.5">
                      {/* Day badge */}
                      <div
                        className="w-12 h-12 rounded-[14px] flex flex-col items-center justify-center flex-shrink-0"
                        style={{
                          background: c.rgba(0.1),
                          border: `1.5px solid ${c.rgba(0.3)}`,
                        }}
                      >
                        <span className="text-[8px] font-bold uppercase" style={{ letterSpacing: '0.1em', color: hex }}>DAY</span>
                        <span className="text-[22px] font-extrabold -mt-0.5 leading-none" style={{ color: hex, fontFeatureSettings: '"tnum"' }}>{day.dayNumber}</span>
                      </div>

                      {/* Title + location */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-[15px] font-bold text-[#1a1a2e] truncate whitespace-nowrap">{day.title}</p>
                        {day.city && (
                          <span
                            className="inline-flex items-center gap-1 mt-1.5 px-2.5 rounded-[20px] text-[11px] font-semibold"
                            style={{
                              background: c.rgba(0.08),
                              border: `1px solid ${c.rgba(0.2)}`,
                              color: hex,
                              padding: '3px 10px',
                            }}
                          >
                            {day.country && countryFlags[day.country] ? `${countryFlags[day.country]} ` : ''}{day.city}
                          </span>
                        )}
                      </div>

                      {/* Chevron */}
                      <svg className="w-3.5 h-3.5 flex-shrink-0 self-center" style={{ color: 'rgba(0,0,0,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>

                    {/* Meal tags */}
                    {(day.mealBreakfast || day.mealLunch || day.mealDinner) && (
                      <div className="flex flex-wrap gap-1.5">
                        {day.mealBreakfast && (
                          <span
                            className="inline-flex items-center h-[26px] px-3 rounded-[20px] text-[12px] font-semibold"
                            style={{ background: c.rgba(0.1), border: `1px solid ${c.rgba(0.25)}`, color: hex }}
                          >
                            🌅 เช้า
                          </span>
                        )}
                        {day.mealLunch && (
                          <span
                            className="inline-flex items-center h-[26px] px-3 rounded-[20px] text-[12px] font-semibold"
                            style={{ background: c.rgba(0.1), border: `1px solid ${c.rgba(0.25)}`, color: hex }}
                          >
                            🍱 กลางวัน
                          </span>
                        )}
                        {day.mealDinner && (
                          <span
                            className="inline-flex items-center h-[26px] px-3 rounded-[20px] text-[12px] font-semibold"
                            style={{ background: c.rgba(0.1), border: `1px solid ${c.rgba(0.25)}`, color: hex }}
                          >
                            🌙 เย็น
                          </span>
                        )}
                      </div>
                    )}

                    {/* Hotel row */}
                    {day.accommodation && (
                      <>
                        <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.06)', margin: '0 -4px' }} />
                        <div className="flex items-center gap-3">
                          {day.accommodation.imageUrl ? (
                            <div className="w-11 h-11 rounded-[10px] overflow-hidden flex-shrink-0 relative" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                              <Image src={day.accommodation.imageUrl} alt="" fill className="object-cover" unoptimized />
                            </div>
                          ) : (
                            <div
                              className="w-11 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0"
                              style={{ background: c.rgba(0.08), border: `1px solid ${c.rgba(0.15)}` }}
                            >
                              <svg className="w-4.5 h-4.5" style={{ color: hex, width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#1a1a2e] truncate">{day.accommodation.name}</p>
                            {(day.accommodation.checkIn || day.accommodation.checkOut) && (
                              <p className="text-[12px] text-[rgba(30,30,60,0.4)] mt-0.5">
                                {day.accommodation.checkIn && `เช็คอิน ${day.accommodation.checkIn}`}
                                {day.accommodation.checkIn && day.accommodation.checkOut && ' · '}
                                {day.accommodation.checkOut && `เช็คเอาต์ ${day.accommodation.checkOut}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      <BottomNav activeTab="itinerary" tourId={tourId} isChina={tour?.isChina ?? false} />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
      <div className="w-8 h-8 border-2 border-[#7c5cfc] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
