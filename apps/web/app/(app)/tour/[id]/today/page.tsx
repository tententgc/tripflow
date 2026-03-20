'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface TourData {
  id: string
  title: string
  isChina: boolean
  countries: string[]
  days: Array<{
    id: string
    dayNumber: number
    date: string
    title: string
    city: string | null
    country: string | null
    mealBreakfast: boolean
    mealLunch: boolean
    mealDinner: boolean
    activities: Array<{ id: string; time: string | null; title: string; titleLocal: string | null; category: string }>
    accommodation: { name: string; wifiName: string | null; wifiPassword: string | null } | null
  }>
  contacts: Array<{ id: string; name: string; phone: string | null; wechat: string | null; line: string | null; type: string }>
  members: Array<{ user: { name: string } }>
}

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷',
}

const categoryIcons: Record<string, string> = {
  SIGHTSEEING: '🏛️', FOOD: '🍜', TRANSPORT: '🚌',
  ACCOMMODATION: '🏨', SHOPPING: '🛍️', TEMPLE: '⛩️',
  NATURE: '🌿', NIGHTLIFE: '🌃', OTHER: '📍',
}

const categoryColors: Record<string, string> = {
  SIGHTSEEING: 'bg-blue-500', FOOD: 'bg-orange-500',
  TRANSPORT: 'bg-gray-400', ACCOMMODATION: 'bg-purple-500',
  SHOPPING: 'bg-pink-500', TEMPLE: 'bg-yellow-500',
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">ไม่พบทริปนี้</p>
      </div>
    )
  }

  // Find today's day
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentDay = tour.days.find((d) => {
    const dayDate = new Date(d.date)
    dayDate.setHours(0, 0, 0, 0)
    return dayDate.getTime() === today.getTime()
  }) ?? tour.days[0]

  const guide = tour.contacts.find((c) => c.type === 'THAI_GUIDE' || c.type === 'LOCAL_GUIDE')

  if (!currentDay) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-primary-600 text-white px-4 pt-6 pb-8">
          <h1 className="text-xl font-bold">{tour.title}</h1>
          <p className="text-primary-200 text-sm mt-1">ยังไม่มีกำหนดการ</p>
        </div>
        <BottomNav activeTab="today" tourId={tourId} isChina={tour.isChina} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero */}
      <div className={`text-white px-4 pt-6 pb-8 ${tour.isChina ? 'bg-red-700' : 'bg-primary-600'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{countryFlags[currentDay.country ?? ''] ?? '🌍'}</span>
          <span className="text-white/80 text-sm">{currentDay.city ?? ''}</span>
        </div>
        <h1 className="text-lg font-bold">{currentDay.title}</h1>
        <p className="text-white/70 text-sm mt-1">
          {new Date(currentDay.date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="px-4 -mt-2 space-y-3">
        {/* Meal badges */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 mb-2">อาหารวันนี้</p>
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${currentDay.mealBreakfast ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-300 line-through'}`}>
              🍳 เช้า
            </span>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${currentDay.mealLunch ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-300 line-through'}`}>
              🍱 กลางวัน
            </span>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${currentDay.mealDinner ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-300 line-through'}`}>
              🍽️ เย็น
            </span>
          </div>
        </div>

        {/* Guide contact */}
        {guide && (
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
            <p className="text-xs text-primary-600 font-medium mb-1">ไกด์ของกลุ่ม</p>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{guide.name}</p>
              <div className="flex gap-2">
                {guide.phone && (
                  <a href={`tel:${guide.phone}`} className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white">📞</span>
                  </a>
                )}
                {tour.isChina && guide.wechat && (
                  <button
                    onClick={() => navigator.clipboard.writeText(guide.wechat!)}
                    className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-xs font-bold">微信</span>
                  </button>
                )}
                {!tour.isChina && guide.line && (
                  <a href={`line://ti/p/~${guide.line}`} className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">LINE</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* WiFi card for China hotels */}
        {tour.isChina && currentDay.accommodation?.wifiName && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs text-blue-600 font-medium mb-1">📶 WiFi โรงแรม</p>
            <p className="font-semibold text-gray-900">{currentDay.accommodation.wifiName}</p>
            {currentDay.accommodation.wifiPassword && (
              <p className="text-gray-500 text-sm">{currentDay.accommodation.wifiPassword}</p>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">กำหนดการวันนี้</h3>
          {currentDay.activities.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">ยังไม่มีกิจกรรม</p>
          ) : (
            currentDay.activities.map((activity, i) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${categoryColors[activity.category] ?? 'bg-gray-400'}`} />
                  {i < currentDay.activities.length - 1 && <div className="w-0.5 bg-gray-100 flex-1 mt-1" />}
                </div>
                <div className="pb-3 flex-1">
                  {activity.time && <p className="text-xs text-gray-400 mb-0.5">{activity.time}</p>}
                  <p className="text-sm font-medium text-gray-900">{categoryIcons[activity.category]} {activity.title}</p>
                  {activity.titleLocal && <p className="text-xs text-gray-400">{activity.titleLocal}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav activeTab="today" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}

function BottomNav({ activeTab, tourId, isChina }: { activeTab: string; tourId: string; isChina: boolean }) {
  const tabs = [
    { id: 'today', label: 'วันนี้', icon: '🏠', href: `/tour/${tourId}/today` },
    { id: 'itinerary', label: 'แผนเที่ยว', icon: '📅', href: `/tour/${tourId}/itinerary` },
    { id: 'checklist', label: 'เช็คลิสต์', icon: '✅', href: `/tour/${tourId}/checklist` },
    { id: 'documents', label: 'ตั๋ว', icon: '🎫', href: `/tour/${tourId}/documents` },
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
