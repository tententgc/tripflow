'use client'

import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { useApi } from '@/lib/swr'

interface ChecklistItem {
  id: string
  label: string
  isImportant: boolean
  checks: Array<{ userId: string }>
}

interface Checklist {
  id: string
  title: string
  emoji: string | null
  items: ChecklistItem[]
}

const glass = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.88)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 20px rgba(0,0,0,0.05)',
} as const

export default function ChecklistPage() {
  const params = useParams()
  const tourId = params.id as string
  const { data: checklists, isLoading: loadingChecklists, mutate: mutateChecklists } = useApi<Checklist[]>(`/api/tours/${tourId}/checklist`)
  const { data: tour } = useApi<{ isChina: boolean }>(`/api/tours/${tourId}`)
  const { data: me } = useApi<{ id: string }>('/api/auth/me')
  const isChina = tour?.isChina ?? false
  const userId = me?.id ?? null
  const loading = loadingChecklists

  async function toggleItem(itemId: string, currentlyChecked: boolean) {
    if (!userId) return
    mutateChecklists(
      (prev) =>
        prev?.map((cl) => ({
          ...cl,
          items: cl.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  checks: currentlyChecked
                    ? item.checks.filter((c) => c.userId !== userId)
                    : [...item.checks, { userId }],
                }
              : item
          ),
        })),
      false,
    )
    await fetch(`/api/tours/${tourId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, userId, checked: !currentlyChecked }),
    })
  }

  if (loading) return <LoadingScreen />

  const allItems = (checklists ?? []).flatMap(cl => cl.items)
  const allChecked = allItems.filter(i => i.checks.some(c => c.userId === userId)).length
  const allTotal = allItems.length
  const allPct = allTotal > 0 ? (allChecked / allTotal) * 100 : 0

  return (
    <div className="min-h-screen bg-[#f0f2f8] relative overflow-hidden" style={{ paddingBottom: '100px' }}>
      <style>{`
        @keyframes clCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes clBarGrow {
          from { width: 0%; }
        }
        @keyframes clCheck {
          0% { transform: scale(0.85); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #ede9f6 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #e8eaf2 0%, transparent 70%)' }} />
      </div>

      <TopBar title="เช็คลิสต์" />

      <div className="relative z-10 px-4 pt-4 max-w-[680px] mx-auto space-y-4">
        {(!checklists || checklists.length === 0) ? (
          <div className="text-center py-16 rounded-[20px]" style={glass}>
            <p className="text-4xl mb-2">✅</p>
            <p className="text-[rgba(30,30,60,0.4)] text-sm">ยังไม่มีเช็คลิสต์</p>
          </div>
        ) : (
          <>
            {/* Overall progress banner */}
            <div className="rounded-[20px] p-5" style={{ ...glass, animation: 'clCardIn 0.3s ease-out 0s both' }}>
              <p className="text-[11px] font-bold uppercase" style={{ color: 'rgba(30,30,60,0.4)', letterSpacing: '0.08em' }}>ความคืบหน้าทั้งหมด</p>
              <div className="flex items-end justify-between mt-1">
                <p className="text-[24px] font-extrabold text-[#1a1a2e]">
                  {allChecked}/{allTotal} <span className="text-[14px] font-semibold text-[rgba(30,30,60,0.4)]">รายการ</span>
                </p>
                <p className="text-[13px] font-bold text-[#7c5cfc]">{Math.round(allPct)}%</p>
              </div>
              <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${allPct}%`,
                    background: allPct >= 100 ? 'linear-gradient(to right, #10b981, #34d399)' : 'linear-gradient(to right, #7c5cfc, #a78bfa)',
                    boxShadow: allPct >= 100 ? '0 0 8px rgba(16,185,129,0.4)' : '0 0 8px rgba(124,92,252,0.4)',
                    animation: 'clBarGrow 0.5s ease-out both',
                  }}
                />
              </div>
            </div>

            {/* Section cards */}
            {checklists.map((cl, idx) => {
              const checkedCount = cl.items.filter((i) => i.checks.some((c) => c.userId === userId)).length
              const total = cl.items.length
              const pct = total > 0 ? (checkedCount / total) * 100 : 0
              const complete = checkedCount === total && total > 0
              const accentColor = complete ? '#10b981' : '#7c5cfc'
              const accentBg = complete ? 'rgba(16,185,129' : 'rgba(124,92,252'

              return (
                <div
                  key={cl.id}
                  className="rounded-[20px] overflow-hidden relative"
                  style={{ ...glass, padding: 0, animation: `clCardIn 0.3s ease-out ${(idx + 1) * 0.07}s both` }}
                >
                  {/* Completion accent bar */}
                  {complete && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px]" style={{ background: `linear-gradient(to bottom, #10b981, rgba(16,185,129,0.25))` }} />
                  )}

                  {/* Header */}
                  <div style={{ padding: '16px 20px 0 20px' }}>
                    <div className="flex items-center gap-2.5">
                      {cl.emoji && <span className="text-[22px] flex-shrink-0">{cl.emoji}</span>}
                      <h3 className="text-[15px] font-bold text-[#1a1a2e] flex-1 min-w-0 truncate">{cl.title}</h3>
                      {complete ? (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 h-6 px-2.5 rounded-[20px] text-[12px] font-bold" style={{ background: `${accentBg},0.1)`, border: `1px solid ${accentBg},0.25)`, color: accentColor }}>
                          ✓ เสร็จแล้ว
                        </span>
                      ) : (
                        <span className="flex-shrink-0 inline-flex items-center h-6 px-2.5 rounded-[20px] text-[12px] font-bold" style={{ background: `${accentBg},0.1)`, border: `1px solid ${accentBg},0.2)`, color: accentColor }}>
                          {checkedCount}/{total}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 mb-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          background: complete ? 'linear-gradient(to right, #10b981, #34d399)' : 'linear-gradient(to right, #7c5cfc, #a78bfa)',
                          boxShadow: `0 0 8px ${accentBg},0.4)`,
                          animation: `clBarGrow 0.5s ease-out ${(idx + 1) * 0.07 + 0.2}s both`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '0 20px' }}>
                    {cl.items.map((item, i) => {
                      const isChecked = item.checks.some((c) => c.userId === userId)
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id, isChecked)}
                          className="w-full flex items-center gap-3 text-left transition-colors duration-150 active:bg-[rgba(255,255,255,0.4)] no-btn-fx"
                          style={{
                            padding: i === cl.items.length - 1 ? '11px 0 16px 0' : '11px 0',
                            borderBottom: i < cl.items.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none',
                            minHeight: '48px',
                          }}
                        >
                          {/* Checkbox */}
                          <div
                            className="w-[22px] h-[22px] rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                            style={isChecked ? {
                              background: 'linear-gradient(135deg, #7c5cfc, #6d4fea)',
                              boxShadow: '0 2px 8px rgba(124,92,252,0.35)',
                              animation: 'clCheck 0.2s ease-out',
                            } : {
                              border: '2px solid rgba(30,30,60,0.2)',
                              borderRadius: '8px',
                            }}
                          >
                            {isChecked && (
                              <svg className="w-[13px] h-[13px]" style={{ color: '#f8f8fc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </div>

                          {/* Label */}
                          <span
                            className="text-[14px] flex-1 transition-all duration-200"
                            style={isChecked ? {
                              color: 'rgba(30,30,60,0.35)',
                              textDecoration: 'line-through',
                              textDecorationColor: 'rgba(124,92,252,0.4)',
                              textDecorationThickness: '1.5px',
                              fontWeight: 400,
                            } : {
                              color: '#1a1a2e',
                              fontWeight: 500,
                            }}
                          >
                            {item.isImportant && !isChecked && <span className="text-[#ef4444] mr-1">*</span>}
                            {item.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      <BottomNav activeTab="checklist" tourId={tourId} isChina={isChina} />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
      <div className="w-8 h-8 border-2 border-[#7c5cfc] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
