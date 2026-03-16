'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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
      <div className="bg-white border-b border-gray-200 px-4 pt-safe-top pb-4">
        <div className="pt-4 flex items-center gap-3">
          <a href="/home" className="text-gray-500 text-2xl leading-none">←</a>
          <div>
            <h1 className="text-lg font-bold text-gray-900">แผนเที่ยว</h1>
            <p className="text-gray-500 text-xs">{tour?.title}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {!tour?.days.length ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📅</p>
            <p>ยังไม่มีกำหนดการ</p>
          </div>
        ) : (
          tour.days.map((day) => (
            <a key={day.id} href={`/tour/${tourId}/day/${day.dayNumber}`} className="block">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs text-primary-600">วันที่</span>
                      <span className="text-lg font-bold text-primary-700">{day.dayNumber}</span>
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
                <div className="flex gap-2 mt-3">
                  {day.mealBreakfast && <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-full">🍳 เช้า</span>}
                  {day.mealLunch && <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">🍱 กลางวัน</span>}
                  {day.mealDinner && <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full">🍽️ เย็น</span>}
                </div>
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function BottomNav({ activeTab, tourId, isChina }: { activeTab: string; tourId: string; isChina: boolean }) {
  const tabs = [
    { id: 'today', label: 'วันนี้', icon: '🏠', href: `/tour/${tourId}/today` },
    { id: 'itinerary', label: 'แผนเที่ยว', icon: '📅', href: `/tour/${tourId}/itinerary` },
    { id: 'checklist', label: 'เช็คลิสต์', icon: '✅', href: `/tour/${tourId}/checklist` },
    ...(isChina ? [{ id: 'phrases', label: 'คำศัพท์', icon: '🀄', href: `/tour/${tourId}/phrases` }] : []),
    { id: 'chat', label: 'ช่วยเหลือ', icon: '💬', href: `/tour/${tourId}/chat` },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex">
        {tabs.map((tab) => (
          <a key={tab.id} href={tab.href} className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs mt-0.5">{tab.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}
