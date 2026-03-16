import { Metadata } from 'next'

export const metadata: Metadata = { title: 'ฉุกเฉิน — TripFlow' }

const CHINA_EMERGENCY_NUMBERS = [
  { number: '110', label: 'ตำรวจ', icon: '👮', color: 'bg-blue-600' },
  { number: '120', label: 'รถพยาบาล', icon: '🚑', color: 'bg-red-600' },
  { number: '119', label: 'ดับเพลิง', icon: '🚒', color: 'bg-orange-600' },
  { number: '12301', label: 'สายท่องเที่ยว', icon: '🛈', color: 'bg-green-600' },
]

const THAI_EMBASSIES_CHINA = [
  { city: 'ปักกิ่ง (สถานทูต)', phone: '+86-10-6532-4985' },
  { city: 'เซี่ยงไฮ้ (สถานกงสุล)', phone: '+86-21-6288-2088' },
  { city: 'กวางโจว (สถานกงสุล)', phone: '+86-20-8385-8988' },
  { city: 'เฉิงตู (สถานกงสุล)', phone: '+86-28-6618-0109' },
  { city: 'คุนหมิง (สถานกงสุล)', phone: '+86-871-6316-8916' },
  { city: 'เซียะเหมิน (สถานกงสุล)', phone: '+86-592-5112-313' },
]

export default function EmergencyPage({ params: _params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-red-600 text-white px-4 pt-safe-top pb-6">
        <div className="pt-4">
          <h1 className="text-xl font-bold">ฉุกเฉิน</h1>
          <p className="text-red-200 text-sm mt-1">แตะเบอร์เพื่อโทรได้ทันที</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Emergency numbers grid */}
        <div className="grid grid-cols-2 gap-3">
          {CHINA_EMERGENCY_NUMBERS.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className={`${item.color} text-white rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px] active:opacity-80 transition-opacity touch-target`}
            >
              <span className="text-3xl mb-2">{item.icon}</span>
              <span className="text-2xl font-bold">{item.number}</span>
              <span className="text-sm mt-1 opacity-90">{item.label}</span>
            </a>
          ))}
        </div>

        {/* Thai Embassy contacts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">🇹🇭 สถานทูตและสถานกงสุลไทยในจีน</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {THAI_EMBASSIES_CHINA.map((embassy) => (
              <a
                key={embassy.city}
                href={`tel:${embassy.phone}`}
                className="flex items-center justify-between px-4 py-3 min-h-[56px] active:bg-gray-50 touch-target"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{embassy.city}</p>
                  <p className="text-sm text-gray-500">{embassy.phone}</p>
                </div>
                <span className="text-primary-600 text-xl">📞</span>
              </a>
            ))}
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2">🛡️ ประกันเดินทาง</h3>
          <p className="text-sm text-gray-600">กรุณาติดต่อบริษัทประกันของท่านโดยตรง</p>
          <p className="text-xs text-gray-400 mt-1">เก็บกรมธรรม์ไว้ในเอกสาร</p>
        </div>

        {/* Note about tourist hotline */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2">ℹ️ สายด่วนท่องเที่ยว 12301</h3>
          <p className="text-sm text-gray-600">มีบริการภาษาไทยและอังกฤษ โทรได้ 24 ชั่วโมง</p>
        </div>
      </div>

      <BottomNav activeTab="emergency" tourId="tour-1" />
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
