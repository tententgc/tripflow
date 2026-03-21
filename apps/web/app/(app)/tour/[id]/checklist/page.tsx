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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="เช็คลิสต์" />

      <div className="px-4 py-4 space-y-4">
        {(!checklists || checklists.length === 0) ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">✅</p>
            <p>ยังไม่มีเช็คลิสต์</p>
          </div>
        ) : (
          (checklists ?? []).map((cl) => {
            const checkedCount = cl.items.filter((i) => i.checks.some((c) => c.userId === userId)).length
            const progress = cl.items.length > 0 ? (checkedCount / cl.items.length) * 100 : 0
            return (
              <div key={cl.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {cl.emoji && <span className="text-xl">{cl.emoji}</span>}
                      <h3 className="font-semibold text-gray-900">{cl.title}</h3>
                    </div>
                    <span className="text-sm text-gray-400">{checkedCount}/{cl.items.length}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {cl.items.map((item) => {
                    const isChecked = item.checks.some((c) => c.userId === userId)
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id, isChecked)}
                        className="w-full flex items-center gap-3 px-4 py-3 min-h-[48px] text-left active:bg-gray-50"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isChecked ? 'bg-gradient-to-br from-indigo-500 to-violet-600 border-transparent shadow-sm shadow-indigo-300' : 'border-gray-300'}`}>
                          {isChecked && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className={`text-sm flex-1 ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.isImportant && !isChecked && <span className="text-red-500 mr-1">*</span>}
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      <BottomNav activeTab="checklist" tourId={tourId} isChina={isChina} />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
