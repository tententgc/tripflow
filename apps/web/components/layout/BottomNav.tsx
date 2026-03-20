'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BottomNavProps {
  activeTab: string
  tourId: string
  isChina: boolean
}

const services = [
  {
    id: 'chat',
    icon: '🤖',
    label: 'AI ช่วยเหลือ',
    desc: 'ถามอะไรก็ได้เกี่ยวกับทริป',
    gradient: 'from-indigo-500 to-violet-600',
    shadow: 'shadow-indigo-200',
  },
  {
    id: 'calculator',
    icon: '💱',
    label: 'แปลงค่าเงิน',
    desc: 'แปลง THB ↔ สกุลเงินปลายทาง',
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-200',
  },
  {
    id: 'split',
    icon: '🍽️',
    label: 'หารค่าใช้จ่าย',
    desc: 'หารบิลกับเพื่อนในทริปแยกชื่อได้',
    gradient: 'from-orange-500 to-rose-500',
    shadow: 'shadow-orange-200',
  },
]

export function BottomNav({ activeTab, tourId, isChina }: BottomNavProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const tabs = [
    { id: 'today',     label: 'วันนี้',    icon: '🏠', href: `/tour/${tourId}/today` },
    { id: 'itinerary', label: 'แผนเที่ยว', icon: '📅', href: `/tour/${tourId}/itinerary` },
    { id: 'checklist', label: 'เช็คลิสต์', icon: '✅', href: `/tour/${tourId}/checklist` },
    { id: 'documents', label: 'ตั๋ว',      icon: '🎫', href: `/tour/${tourId}/documents` },
  ]

  const isMoreActive = activeTab === 'chat' || activeTab === 'calculator' || activeTab === 'split'

  return (
    <>
      {/* Bottom sheet overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div className={`fixed left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out ${
        open ? 'bottom-0' : '-bottom-full'
      }`}>
        <div className="px-4 pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">เลือกบริการ</p>
          <div className="space-y-2.5">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setOpen(false)
                  router.push(`/tour/${tourId}/${s.id}`)
                }}
                className={`w-full flex items-center gap-4 p-3.5 rounded-2xl bg-gradient-to-r ${s.gradient} shadow-lg ${s.shadow} active:scale-[0.98] transition-transform`}
              >
                <span className="text-2xl w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">{s.icon}</span>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">{s.label}</p>
                  <p className="text-white/70 text-xs mt-0.5">{s.desc}</p>
                </div>
                <span className="ml-auto text-white/50 text-lg">›</span>
              </button>
            ))}
          </div>
          <div className="h-safe-bottom pb-4" />
        </div>
      </div>

      {/* Nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 pb-safe shadow-lg shadow-black/5 z-30">
        <div className="flex">
          {tabs.map((tab) => (
            <a
              key={tab.id}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-all duration-150 relative ${
                activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className={`text-[10px] mt-0.5 leading-tight text-center font-medium ${activeTab === tab.id ? 'text-indigo-600' : ''}`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full" />
              )}
            </a>
          ))}

          {/* More button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-all duration-150 relative ${
              isMoreActive ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <span className={`text-xl transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>✦</span>
            <span className={`text-[10px] mt-0.5 leading-tight text-center font-medium ${isMoreActive ? 'text-indigo-600' : ''}`}>
              เพิ่มเติม
            </span>
            {isMoreActive && (
              <span className="absolute bottom-0 w-6 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full" />
            )}
          </button>
        </div>
      </nav>
    </>
  )
}
