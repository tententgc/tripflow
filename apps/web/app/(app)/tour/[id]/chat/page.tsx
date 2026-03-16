import { Metadata } from 'next'

export const metadata: Metadata = { title: 'AI ช่วยเหลือ — TripFlow' }

const quickReplies = [
  'วันนี้ทำอะไรบ้าง',
  'ร้านอาหารใกล้ๆ',
  'ไปโรงแรมยังไง',
  'เบอร์ฉุกเฉิน',
  'แปลภาษาช่วย',
]

const mockMessages = [
  {
    role: 'assistant',
    content: 'สวัสดีครับ! ผมคือผู้ช่วย TripFlow วันนี้คุณอยู่ที่ปักกิ่ง วันที่ 3 ของทริป มีอะไรให้ช่วยไหมครับ?',
  },
]

export default function ChatPage({ params: _params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-safe-top pb-4">
        <div className="pt-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">AI</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">AI ช่วยเหลือ</h1>
            <p className="text-xs text-green-500">● ออนไลน์ (Qwen — สำหรับทริปจีน)</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto pb-40">
        {mockMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Quick replies + input */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 space-y-3">
        {/* Quick reply chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              className="flex-shrink-0 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium touch-target whitespace-nowrap"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button className="w-11 h-11 bg-primary-600 rounded-full flex items-center justify-center touch-target">
            <span className="text-white">↑</span>
          </button>
        </div>
      </div>

      <BottomNav activeTab="chat" tourId="tour-1" />
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
