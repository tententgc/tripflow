import { Metadata } from 'next'

export const metadata: Metadata = { title: 'แผนเที่ยว — TripFlow' }

const mockDays = [
  {
    dayNumber: 1,
    date: new Date('2026-04-01'),
    title: 'กรุงเทพ → ปักกิ่ง',
    city: 'ปักกิ่ง',
    country: 'CN',
    mealBreakfast: false,
    mealLunch: true,
    mealDinner: true,
    passType: null,
  },
  {
    dayNumber: 2,
    date: new Date('2026-04-02'),
    title: 'กำแพงเมืองจีน',
    city: 'ปักกิ่ง',
    country: 'CN',
    mealBreakfast: true,
    mealLunch: true,
    mealDinner: true,
    passType: null,
  },
  {
    dayNumber: 3,
    date: new Date('2026-04-03'),
    title: 'พระราชวังต้องห้าม',
    city: 'ปักกิ่ง',
    country: 'CN',
    mealBreakfast: true,
    mealLunch: true,
    mealDinner: true,
    passType: null,
  },
]

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷',
}

export default function ItineraryPage({ params: _params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 px-4 pt-safe-top pb-4">
        <div className="pt-4 flex items-center gap-3">
          <a href="/home" className="text-gray-600 touch-target flex items-center">
            ←
          </a>
          <h1 className="text-xl font-bold text-gray-900">แผนเที่ยว</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">ทัวร์จีน ปักกิ่ง 6 วัน</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {mockDays.map((day) => (
          <a key={day.dayNumber} href={`/tour/tour-1/day/${day.dayNumber}`} className="block">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs text-primary-600 font-medium">วันที่</span>
                    <span className="text-lg font-bold text-primary-700">{day.dayNumber}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{day.title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <span>{countryFlags[day.country]}</span>
                      <span className="text-sm text-gray-500">{day.city}</span>
                    </div>
                  </div>
                </div>
                <span className="text-gray-400">›</span>
              </div>

              {/* Meal badges */}
              <div className="flex gap-2 mt-3">
                {day.mealBreakfast && (
                  <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-full">🍳 เช้า</span>
                )}
                {day.mealLunch && (
                  <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">🍱 กลางวัน</span>
                )}
                {day.mealDinner && (
                  <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full">🍽️ เย็น</span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>

      <BottomNav activeTab="itinerary" tourId="tour-1" />
    </div>
  )
}

function BottomNav({ activeTab, tourId }: { activeTab: string; tourId: string }) {
  const tabs = [
    { id: 'today', label: 'วันนี้', icon: '🏠', href: `/tour/${tourId}/today` },
    { id: 'itinerary', label: 'แผนเที่ยว', icon: '📅', href: `/tour/${tourId}/itinerary` },
    { id: 'transport', label: 'การเดินทาง', icon: '🚌', href: `/tour/${tourId}/transport` },
    { id: 'checklist', label: 'เช็คลิสต์', icon: '✅', href: `/tour/${tourId}/checklist` },
    { id: 'chat', label: 'ช่วยเหลือ', icon: '💬', href: `/tour/${tourId}/chat` },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] touch-target transition-colors ${
              activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs mt-0.5">{tab.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}
