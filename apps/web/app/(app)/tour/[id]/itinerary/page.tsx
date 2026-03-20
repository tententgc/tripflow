'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'

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

export default function ItineraryPage() {
  const params = useParams()
  const tourId = params.id as string
  const [tour, setTour] = useState<TourBasic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => { setTour(data); setLoading(false) })
  }, [tourId])

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="แผนเที่ยว" subtitle={tour?.title} backHref="/home" />

      <div className="px-4 py-4 space-y-3">
        {!tour?.days.length ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📅</p>
            <p>ยังไม่มีกำหนดการ</p>
          </div>
        ) : (
          tour.days.map((day) => (
            <a key={day.id} href={`/tour/${tourId}/day/${day.dayNumber}`} className="block">
              <div className="card-interactive bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs text-indigo-500">วันที่</span>
                      <span className="text-lg font-bold text-indigo-700">{day.dayNumber}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{day.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {day.country && <span>{countryFlags[day.country] ?? '🌍'}</span>}
                        <span className="text-xs text-gray-500">{day.city ?? ''}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-300 text-lg">›</span>
                </div>
                {/* Meals + Accommodation row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {day.mealBreakfast && <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-full">🍳 เช้า</span>}
                  {day.mealLunch && <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">🍱 กลางวัน</span>}
                  {day.mealDinner && <span className="text-xs px-2 py-1 bg-violet-50 text-violet-600 rounded-full">🍽️ เย็น</span>}
                </div>

                {/* Accommodation */}
                {day.accommodation && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                    {day.accommodation.imageUrl ? (
                      <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={day.accommodation.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-base">🏨</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{day.accommodation.name}</p>
                      {(day.accommodation.checkIn || day.accommodation.checkOut) && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {day.accommodation.checkIn && `เช็คอิน ${day.accommodation.checkIn}`}
                          {day.accommodation.checkIn && day.accommodation.checkOut && ' · '}
                          {day.accommodation.checkOut && `เช็คเอาต์ ${day.accommodation.checkOut}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </a>
          ))
        )}
      </div>

      <BottomNav activeTab="itinerary" tourId={tourId} isChina={tour?.isChina ?? false} />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
