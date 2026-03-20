'use client'

interface Tab {
  id: string
  label: string
  icon: string
  href: string
}

interface BottomNavProps {
  activeTab: string
  tourId: string
  isChina: boolean
}

export function BottomNav({ activeTab, tourId, isChina }: BottomNavProps) {
  const tabs: Tab[] = [
    { id: 'today',     label: 'วันนี้',    icon: '🏠', href: `/tour/${tourId}/today` },
    { id: 'itinerary', label: 'แผนเที่ยว', icon: '📅', href: `/tour/${tourId}/itinerary` },
    { id: 'checklist', label: 'เช็คลิสต์', icon: '✅', href: `/tour/${tourId}/checklist` },
    { id: 'documents', label: 'ตั๋ว',      icon: '🎫', href: `/tour/${tourId}/documents` },
    ...(isChina ? [{ id: 'phrases', label: 'คำศัพท์', icon: '🀄', href: `/tour/${tourId}/phrases` }] : []),
    { id: 'chat',      label: 'ช่วยเหลือ', icon: '💬', href: `/tour/${tourId}/chat` },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={tab.href}
            className={`nav-tab flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] ${
              activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] mt-0.5 leading-tight text-center">{tab.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}
