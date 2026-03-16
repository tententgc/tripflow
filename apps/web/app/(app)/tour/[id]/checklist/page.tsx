import { Metadata } from 'next'

export const metadata: Metadata = { title: 'เช็คลิสต์ — TripFlow' }

const mockChecklists = [
  {
    id: 'cl-1',
    title: 'เตรียมเดินทางจีน',
    emoji: '🇨🇳',
    items: [
      { id: 'i-1', label: 'วีซ่าจีน', isImportant: true, isChecked: true },
      { id: 'i-2', label: 'ประกันเดินทาง', isImportant: true, isChecked: true },
      { id: 'i-3', label: 'แลกเงินหยวน (CNY)', isImportant: true, isChecked: false },
      { id: 'i-4', label: 'ดาวน์โหลดแผนที่ออฟไลน์', isImportant: false, isChecked: false },
      { id: 'i-5', label: 'แจ้งธนาคารก่อนเดินทาง', isImportant: false, isChecked: true },
      { id: 'i-6', label: 'ซื้อซิมการ์ดจีนหรือพ็อกเก็ตไวไฟ', isImportant: false, isChecked: false },
      { id: 'i-7', label: 'เตรียมยา', isImportant: false, isChecked: false },
    ],
  },
  {
    id: 'cl-2',
    title: 'สัมภาระ',
    emoji: '🧳',
    items: [
      { id: 'i-8', label: 'หนังสือเดินทาง', isImportant: true, isChecked: false },
      { id: 'i-9', label: 'เสื้อผ้า 6 วัน', isImportant: false, isChecked: false },
      { id: 'i-10', label: 'Adapter ปลั๊กไฟ', isImportant: false, isChecked: false },
      { id: 'i-11', label: 'Power Bank', isImportant: false, isChecked: false },
    ],
  },
]

export default function ChecklistPage({ params: _params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 px-4 pt-safe-top pb-4">
        <div className="pt-4">
          <h1 className="text-xl font-bold text-gray-900">เช็คลิสต์</h1>
          <p className="text-gray-500 text-sm mt-1">ทัวร์จีน ปักกิ่ง 6 วัน</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {mockChecklists.map((checklist) => {
          const checkedCount = checklist.items.filter(i => i.isChecked).length
          const progress = (checkedCount / checklist.items.length) * 100

          return (
            <div key={checklist.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{checklist.emoji}</span>
                    <h3 className="font-semibold text-gray-900">{checklist.title}</h3>
                  </div>
                  <span className="text-sm text-gray-500">{checkedCount}/{checklist.items.length}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {checklist.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 min-h-[44px]">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      item.isChecked ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                    }`}>
                      {item.isChecked && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-sm flex-1 ${item.isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.isImportant && !item.isChecked && <span className="text-red-500 mr-1">*</span>}
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav activeTab="checklist" tourId="tour-1" />
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
