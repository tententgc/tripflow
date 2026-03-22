'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BottomNavProps {
  activeTab: string
  tourId: string
  isChina: boolean
}

const services = [
  {
    id: 'chat',
    label: 'AI ช่วยเหลือ',
    desc: 'ถามอะไรก็ได้เกี่ยวกับทริป',
  },
  {
    id: 'calculator',
    label: 'แปลงค่าเงิน',
    desc: 'แปลง THB ↔ สกุลเงินปลายทาง',
  },
  {
    id: 'checklist',
    label: 'เช็คลิสต์',
    desc: 'รายการที่ต้องเตรียมและทำในทริป',
  },
  {
    id: 'fund',
    label: 'เงินกองกลาง',
    desc: 'เก็บเงินรวม และตัดจ่ายค่าใช้จ่ายกลุ่ม',
  },
]

const serviceIcons: Record<string, React.ReactNode> = {
  chat: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  ),
  calculator: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  checklist: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  fund: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
}

const tabIcons: Record<string, (active: boolean) => React.ReactNode> = {
  today: (active) => (
    <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  itinerary: (active) => (
    <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  split: (active) => (
    <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  documents: (active) => (
    <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
  ),
}

export function BottomNav({ activeTab, tourId, isChina }: BottomNavProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const tabs = [
    { id: 'today',     label: 'วันนี้',    href: `/tour/${tourId}/today` },
    { id: 'itinerary', label: 'แผนเที่ยว', href: `/tour/${tourId}/itinerary` },
    { id: 'split',     label: 'หารตังค์',  href: `/tour/${tourId}/split` },
    { id: 'documents', label: 'ตั๋ว',      href: `/tour/${tourId}/documents` },
  ]

  const handleServiceClick = useCallback((serviceId: string) => () => {
    setOpen(false)
    router.push(`/tour/${tourId}/${serviceId}`)
  }, [router, tourId])

  const isMoreActive = activeTab === 'chat' || activeTab === 'calculator' || activeTab === 'checklist' || activeTab === 'fund'

  const serviceTints: Record<string, { bg: string; color: string }> = {
    chat:       { bg: 'rgba(124,92,252,0.1)',  color: '#8b5cf6' },
    calculator: { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
    checklist:  { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
    fund:       { bg: 'rgba(249,115,22,0.1)',  color: '#f97316' },
  }

  return (
    <>
      <style>{`
        @keyframes sheetSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes sheetBdIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sheetRowIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPopIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.94); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
      `}</style>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{
            background: 'rgba(15,10,30,0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            animation: 'sheetBdIn 0.2s ease both',
          }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile bottom sheet (<900px) */}
      {open && (
        <div
          className="fixed left-0 right-0 bottom-0 z-50 min-[900px]:hidden overflow-y-auto"
          style={{
            maxHeight: '85vh',
            background: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.9)',
            borderBottom: 'none',
            borderRadius: '28px 28px 0 0',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 -8px 40px rgba(0,0,0,0.1), 0 -2px 12px rgba(0,0,0,0.05)',
            animation: 'sheetSlideUp 0.32s cubic-bezier(0.34,1.2,0.64,1) both',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center" style={{ margin: '12px auto 0' }}>
            <div className="rounded-full" style={{ width: '36px', height: '4px', background: 'rgba(0,0,0,0.12)' }} />
          </div>

          {/* Header */}
          <div style={{ padding: '16px 20px 12px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
            <p className="text-[13px] font-bold uppercase" style={{ color: 'rgba(30,30,60,0.4)', letterSpacing: '0.08em' }}>เลือกบริการ</p>
          </div>

          {/* Service list */}
          <div style={{ padding: '8px 16px 32px 16px' }}>
            {services.map((s, i) => {
              const tint = serviceTints[s.id] ?? { bg: 'rgba(0,0,0,0.06)', color: '#6b7280' }
              return (
                <div key={s.id}>
                  {i > 0 && <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.05)', marginLeft: '58px' }} />}
                  <button
                    onClick={handleServiceClick(s.id)}
                    className="w-full flex items-center gap-3.5 no-btn-fx active:scale-[0.98] transition-all duration-150"
                    style={{
                      padding: '14px 4px',
                      borderRadius: '14px',
                      animation: `sheetRowIn 0.2s ease-out ${0.15 + i * 0.03}s both`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,92,252,0.04)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0" style={{ background: tint.bg, color: tint.color }}>
                      {serviceIcons[s.id]}
                    </span>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#1a1a2e]">{s.label}</p>
                      <p className="text-[12px] mt-0.5 truncate whitespace-nowrap" style={{ color: 'rgba(30,30,60,0.4)' }}>{s.desc}</p>
                    </div>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.18)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              )
            })}
            <div className="h-safe-bottom" />
          </div>
        </div>
      )}

      {/* Desktop centered modal (>=900px) */}
      {open && (
        <div
          className="fixed z-50 hidden min-[900px]:block"
          style={{
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '92vw', maxWidth: '400px',
            background: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.9)',
            borderRadius: '24px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 24px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08)',
            animation: 'modalPopIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '18px 20px 14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
            <p className="text-[13px] font-bold uppercase" style={{ color: 'rgba(30,30,60,0.4)', letterSpacing: '0.08em' }}>เลือกบริการ</p>
          </div>

          {/* Service list */}
          <div style={{ padding: '8px 16px 20px 16px' }}>
            {services.map((s, i) => {
              const tint = serviceTints[s.id] ?? { bg: 'rgba(0,0,0,0.06)', color: '#6b7280' }
              return (
                <div key={s.id}>
                  {i > 0 && <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.05)', marginLeft: '58px' }} />}
                  <button
                    onClick={handleServiceClick(s.id)}
                    className="w-full flex items-center gap-3.5 no-btn-fx active:scale-[0.98] transition-all duration-150"
                    style={{
                      padding: '14px 4px',
                      borderRadius: '14px',
                      animation: `sheetRowIn 0.2s ease-out ${0.12 + i * 0.03}s both`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,92,252,0.04)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0" style={{ background: tint.bg, color: tint.color }}>
                      {serviceIcons[s.id]}
                    </span>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#1a1a2e]">{s.label}</p>
                      <p className="text-[12px] mt-0.5 truncate whitespace-nowrap" style={{ color: 'rgba(30,30,60,0.4)' }}>{s.desc}</p>
                    </div>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.18)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Nav bar — light glass */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/70 backdrop-blur-2xl border-t border-gray-200/50 pb-safe">
        <div className="flex max-w-[1100px] min-[900px]:px-8 mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 min-h-[56px] transition-all duration-150 relative ${
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                }`}
              >
                {tabIcons[tab.id]?.(isActive)}
                <span className={`text-[10px] mt-1 leading-tight text-center font-medium ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-5 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
                )}
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 min-h-[56px] transition-all duration-150 relative ${
              isMoreActive || open ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <svg className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-45' : ''}`} fill={isMoreActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isMoreActive ? 0 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <span className={`text-[10px] mt-1 leading-tight text-center font-medium ${isMoreActive || open ? 'text-indigo-600' : 'text-gray-400'}`}>
              เพิ่มเติม
            </span>
            {isMoreActive && (
              <span className="absolute bottom-1 w-5 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
            )}
          </button>
        </div>
      </nav>
    </>
  )
}
