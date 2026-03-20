'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'

interface Member {
  id: string
  name: string
  avatarUrl: string | null
}

interface SplitItem {
  id: string
  label: string
  amount: string
  members: string[] // member ids
}

export default function SplitPage() {
  const params = useParams()
  const tourId = params.id as string
  const [isChina, setIsChina] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [items, setItems] = useState<SplitItem[]>([
    { id: '1', label: '', amount: '', members: [] },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tours/${tourId}`)
      .then(r => r.json())
      .then(data => {
        setIsChina(data.isChina)
        const ms: Member[] = (data.members ?? []).map((m: { user: { id: string; name: string; avatarUrl: string | null } }) => ({
          id: m.user.id,
          name: m.user.name,
          avatarUrl: m.user.avatarUrl,
        }))
        setMembers(ms)
        // default select all
        setItems([{ id: '1', label: '', amount: '', members: ms.map(m => m.id) }])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tourId])

  function addItem() {
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      label: '',
      amount: '',
      members: members.map(m => m.id),
    }])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateItem(id: string, field: 'label' | 'amount', value: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  function toggleMember(itemId: string, memberId: string) {
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i
      const has = i.members.includes(memberId)
      return { ...i, members: has ? i.members.filter(m => m !== memberId) : [...i.members, memberId] }
    }))
  }

  function toggleAll(itemId: string) {
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i
      const allSelected = i.members.length === members.length
      return { ...i, members: allSelected ? [] : members.map(m => m.id) }
    }))
  }

  // Compute per-person total across all items
  const perPerson: Record<string, number> = {}
  for (const member of members) perPerson[member.id] = 0
  for (const item of items) {
    const amt = parseFloat(item.amount) || 0
    const n = item.members.length
    if (n > 0 && amt > 0) {
      const share = amt / n
      for (const mid of item.members) {
        perPerson[mid] = (perPerson[mid] ?? 0) + share
      }
    }
  }

  const grandTotal = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar
        title="หารค่าใช้จ่าย"
        subtitle="แยกชื่อได้เลย"
        gradient="bg-gradient-to-br from-orange-500 to-rose-500"
      />

      <div className="px-4 py-4 space-y-3">
        {/* Items */}
        {items.map((item, idx) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                <input
                  value={item.label}
                  onChange={e => updateItem(item.id, 'label', e.target.value)}
                  placeholder="รายการ (เช่น อาหารเที่ยง)"
                  className="flex-1 text-sm font-medium text-gray-900 focus:outline-none placeholder-gray-300"
                />
                {items.length > 1 && (
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">฿</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={item.amount}
                  onChange={e => updateItem(item.id, 'amount', e.target.value)}
                  placeholder="0"
                  className="flex-1 text-2xl font-bold text-gray-900 focus:outline-none placeholder-gray-200"
                />
                {item.members.length > 0 && parseFloat(item.amount) > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">ต่อคน</p>
                    <p className="text-base font-bold text-orange-500">
                      ฿{((parseFloat(item.amount) || 0) / item.members.length).toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Member selector */}
            <div className="border-t border-gray-50 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">เลือกผู้ร่วมหาร</p>
                <button onClick={() => toggleAll(item.id)} className="text-[10px] text-orange-500 font-medium">
                  {item.members.length === members.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const selected = item.members.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMember(item.id, m.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selected
                          ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${selected ? 'bg-white/30' : 'bg-gray-200'}`}>
                        {m.name[0]}
                      </span>
                      {m.name.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Add item */}
        <button
          onClick={addItem}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-medium hover:border-orange-300 hover:text-orange-400 transition-colors"
        >
          + เพิ่มรายการ
        </button>

        {/* Summary */}
        {grandTotal > 0 && (
          <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl p-5 shadow-lg shadow-orange-200">
            <div className="flex justify-between items-center mb-4">
              <p className="text-white font-bold text-base">สรุปยอด</p>
              <p className="text-white font-bold text-xl">฿{grandTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-2.5">
              {members.map(m => {
                const amt = perPerson[m.id] ?? 0
                if (amt === 0) return null
                return (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {m.name[0]}
                      </div>
                      <span className="text-white text-sm">{m.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-white font-bold text-sm">
                      ฿{amt.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <BottomNav activeTab="split" tourId={tourId} isChina={isChina} />
    </div>
  )
}
