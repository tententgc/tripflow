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
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷',
  IT: '🇮🇹', GB: '🇬🇧', DE: '🇩🇪', SG: '🇸🇬', AU: '🇦🇺',
}

// สีประจำวันในสัปดาห์ตามธรรมเนียมไทย
// อาทิตย์=แดง จันทร์=เหลือง อังคาร=ชมพู พุธ=เขียว พฤหัส=ส้ม ศุกร์=ฟ้า เสาร์=ม่วง
const dayColors: { gradient: string; shadow: string; border: string; text: string }[] = [
  { gradient: 'from-red-400 to-rose-500',    shadow: 'shadow-red-200/50',    border: 'border-red-200/40',    text: 'text-red-400' },    // อาทิตย์
  { gradient: 'from-yellow-400 to-amber-500', shadow: 'shadow-yellow-200/50', border: 'border-yellow-200/40', text: 'text-yellow-500' }, // จันทร์
  { gradient: 'from-pink-400 to-rose-500',    shadow: 'shadow-pink-200/50',   border: 'border-pink-200/40',   text: 'text-pink-400' },   // อังคาร
  { gradient: 'from-emerald-400 to-green-500', shadow: 'shadow-emerald-200/50', border: 'border-emerald-200/40', text: 'text-emerald-500' }, // พุธ
  { gradient: 'from-orange-400 to-amber-500',  shadow: 'shadow-orange-200/50',  border: 'border-orange-200/40',  text: 'text-orange-400' },  // พฤหัส
  { gradient: 'from-sky-400 to-blue-500',      shadow: 'shadow-sky-200/50',     border: 'border-sky-200/40',     text: 'text-sky-500' },     // ศุกร์
  { gradient: 'from-violet-400 to-purple-500',  shadow: 'shadow-violet-200/50',  border: 'border-violet-200/40',  text: 'text-violet-400' },  // เสาร์
]

function getDayColor(dateStr: string) {
  const dow = new Date(dateStr).getDay() // 0=Sun 1=Mon ... 6=Sat
  return dayColors[dow]!
}

export default function ItineraryPage() {
  const params = useParams()
  const tourId = params.id as string
  const { data: tour, isLoading: loading } = useApi<TourBasic>(`/api/tours/${tourId}?fields=basic`)

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20 pb-24">
      <TopBar title="แผนเที่ยว" subtitle={tour?.title ?? ''} backHref="/home" />

      <div className="px-4 py-4 space-y-3">
        {!tour?.days.length ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-100/60 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">ยังไม่มีกำหนดการ</p>
          </div>
        ) : (
          tour.days.map((day) => {
            const c = getDayColor(day.date)
            return (
            <Link key={day.id} href={`/tour/${tourId}/day/${day.dayNumber}`} className="block">
              <div className={`bg-white/80 backdrop-blur-xl rounded-2xl ${c.border} border p-4 active:scale-[0.99] transition-all relative overflow-hidden`}>
                {/* Left accent — สีประจำวัน */}
                <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-gradient-to-b ${c.gradient}`} />

                <div className="flex items-start justify-between pl-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${c.gradient} rounded-xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm ${c.shadow}`}>
                      <span className="text-[10px] text-white/70 font-medium">DAY</span>
                      <span className="text-lg font-bold text-white -mt-0.5">{day.dayNumber}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{day.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {day.country && <span className="text-sm">{countryFlags[day.country] ?? ''}</span>}
                        <span className={`text-xs ${c.text}`}>{day.city ?? ''}</span>
                      </div>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 ${c.text} opacity-50 mt-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>

                {/* Meals */}
                <div className="flex items-center gap-1.5 mt-3 pl-2 flex-wrap">
                  {day.mealBreakfast && (
                    <span className="text-[11px] px-2 py-1 bg-orange-50/80 text-orange-600 border border-orange-100/50 rounded-lg font-medium">เช้า</span>
                  )}
                  {day.mealLunch && (
                    <span className="text-[11px] px-2 py-1 bg-green-50/80 text-green-600 border border-green-100/50 rounded-lg font-medium">กลางวัน</span>
                  )}
                  {day.mealDinner && (
                    <span className="text-[11px] px-2 py-1 bg-violet-50/80 text-violet-600 border border-violet-100/50 rounded-lg font-medium">เย็น</span>
                  )}
                </div>

                {/* Accommodation */}
                {day.accommodation && (
                  <div className="mt-3 pt-3 border-t border-indigo-50 flex items-center gap-3 pl-2">
                    {day.accommodation.imageUrl ? (
                      <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-indigo-100/40 relative">
                        <Image src={day.accommodation.imageUrl} alt="" fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{day.accommodation.name}</p>
                      {(day.accommodation.checkIn || day.accommodation.checkOut) && (
                        <p className="text-[10px] text-indigo-400/70 mt-0.5">
                          {day.accommodation.checkIn && `เช็คอิน ${day.accommodation.checkIn}`}
                          {day.accommodation.checkIn && day.accommodation.checkOut && ' · '}
                          {day.accommodation.checkOut && `เช็คเอาต์ ${day.accommodation.checkOut}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-indigo-50/20">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
