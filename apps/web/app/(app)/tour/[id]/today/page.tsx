'use client'

interface WeatherCardProps {
  temp: number
  description: string
  city: string
}

function WeatherCard({ temp, description, city }: WeatherCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{city}</p>
          <p className="text-3xl font-light text-gray-900">{temp}°C</p>
          <p className="text-gray-600 text-sm mt-1">{description}</p>
        </div>
        <div className="text-5xl">🌤️</div>
      </div>
    </div>
  )
}

interface MealBadgesProps {
  breakfast: boolean
  lunch: boolean
  dinner: boolean
}

function MealBadges({ breakfast, lunch, dinner }: MealBadgesProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-3">อาหารวันนี้</h3>
      <div className="flex gap-3">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${breakfast ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-400 line-through'}`}>
          <span>🍳</span> อาหารเช้า
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${lunch ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400 line-through'}`}>
          <span>🍱</span> กลางวัน
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${dinner ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-400 line-through'}`}>
          <span>🍽️</span> เย็น
        </div>
      </div>
    </div>
  )
}

interface TimelineItemProps {
  time: string
  title: string
  titleLocal?: string
  category: string
  isLast?: boolean
}

function TimelineItem({ time, title, titleLocal, category, isLast = false }: TimelineItemProps) {
  const categoryColors: Record<string, string> = {
    SIGHTSEEING: 'bg-blue-500',
    FOOD: 'bg-orange-500',
    TRANSPORT: 'bg-gray-500',
    ACCOMMODATION: 'bg-purple-500',
    SHOPPING: 'bg-pink-500',
    TEMPLE: 'bg-yellow-500',
  }

  const categoryIcons: Record<string, string> = {
    SIGHTSEEING: '🏛️',
    FOOD: '🍜',
    TRANSPORT: '🚌',
    ACCOMMODATION: '🏨',
    SHOPPING: '🛍️',
    TEMPLE: '⛩️',
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${categoryColors[category] ?? 'bg-gray-400'} mt-1 flex-shrink-0`} />
        {!isLast && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-1">{time}</p>
        <p className="font-medium text-gray-900">{categoryIcons[category]} {title}</p>
        {titleLocal && <p className="text-sm text-gray-400 mt-0.5">{titleLocal}</p>}
      </div>
    </div>
  )
}

interface GuideCardProps {
  name: string
  phone: string
  wechat?: string
  line?: string
  isChina: boolean
}

function GuideCard({ name, phone, wechat, line, isChina }: GuideCardProps) {
  return (
    <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-primary-600 font-medium mb-1">ไกด์ของกลุ่ม</p>
          <p className="font-semibold text-gray-900">{name}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`tel:${phone}`}
            className="w-11 h-11 bg-primary-600 rounded-full flex items-center justify-center touch-target"
          >
            <span className="text-white text-xl">📞</span>
          </a>
          {!isChina && line && (
            <a
              href={`line://ti/p/~${line}`}
              className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center touch-target"
            >
              <span className="text-white text-sm font-bold">LINE</span>
            </a>
          )}
          {isChina && wechat && (
            <button
              onClick={() => navigator.clipboard.writeText(wechat)}
              className="w-11 h-11 bg-green-600 rounded-full flex items-center justify-center touch-target"
            >
              <span className="text-white text-xs font-bold">微信</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const mockActivities = [
  { time: '08:00', title: 'อาหารเช้าที่โรงแรม', titleLocal: '酒店早餐', category: 'FOOD' },
  { time: '09:30', title: 'พระราชวังต้องห้าม', titleLocal: '故宫博物院', category: 'SIGHTSEEING' },
  { time: '12:30', title: 'อาหารกลางวัน ภัตตาคารปักกิ่ง', titleLocal: '北京烤鸭餐厅', category: 'FOOD' },
  { time: '14:00', title: 'จัตุรัสเทียนอันเหมิน', titleLocal: '天安门广场', category: 'SIGHTSEEING' },
  { time: '16:30', title: 'ช้อปปิ้ง ถนนหวังฝูจิ่ง', titleLocal: '王府井步行街', category: 'SHOPPING' },
  { time: '19:00', title: 'อาหารเย็น', titleLocal: '晚餐', category: 'FOOD' },
]

export default function TodayPage({ params: _params }: { params: { id: string } }) {
  const isChina = true
  const today = new Date()
  const dateStr = today.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-b from-china-red to-red-800 text-white px-4 pt-safe-top pb-8">
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🇨🇳</span>
            <span className="text-white/80 text-sm">ปักกิ่ง, จีน</span>
          </div>
          <h1 className="text-xl font-bold">วันที่ 3 — พระราชวังต้องห้าม</h1>
          <p className="text-white/70 text-sm mt-1">{dateStr}</p>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Meal badges — shown first, Thai tour travelers check this first */}
        <MealBadges breakfast={true} lunch={true} dinner={true} />

        {/* Weather */}
        <WeatherCard temp={22} description="เมฆบางส่วน" city="ปักกิ่ง" />

        {/* Guide contact — always visible for China tours */}
        {isChina && (
          <GuideCard
            name="ไกด์จีน — คุณหลี่"
            phone="+86-138-0013-8000"
            wechat="guide_li_beijing"
            isChina={true}
          />
        )}

        {/* Today's timeline */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">กำหนดการวันนี้</h3>
          {mockActivities.map((activity, i) => (
            <TimelineItem
              key={i}
              time={activity.time}
              title={activity.title}
              titleLocal={activity.titleLocal}
              category={activity.category}
              isLast={i === mockActivities.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Bottom navigation */}
      <BottomNav activeTab="today" tourId="tour-1" />
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
