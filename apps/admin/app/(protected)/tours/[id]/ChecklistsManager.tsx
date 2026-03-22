'use client'

import { useState } from 'react'

interface ChecklistItem {
  id: string
  label: string
  labelEn: string | null
  isImportant: boolean
  order: number
}

interface Checklist {
  id: string
  title: string
  titleEn: string | null
  emoji: string | null
  type: string
  order: number
  items: ChecklistItem[]
}

export default function ChecklistsManager({
  tourId,
  initialChecklists,
}: {
  tourId: string
  initialChecklists: Checklist[]
}) {
  const [checklists, setChecklists] = useState<Checklist[]>(initialChecklists)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null)
  const [newItemLabel, setNewItemLabel] = useState('')
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  async function addChecklist() {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tours/${tourId}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), emoji: newEmoji.trim() || null }),
      })
      if (res.ok) {
        const cl = await res.json() as Checklist
        setChecklists(prev => [...prev, cl])
        setNewTitle('')
        setNewEmoji('')
        setAdding(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteChecklist(clId: string) {
    if (!confirm('ลบเช็คลิสต์นี้?')) return
    const res = await fetch(`/api/tours/${tourId}/checklists/${clId}`, { method: 'DELETE' })
    if (res.ok) setChecklists(prev => prev.filter(c => c.id !== clId))
  }

  async function addItem(clId: string) {
    if (!newItemLabel.trim()) return
    const res = await fetch(`/api/tours/${tourId}/checklists/${clId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newItemLabel.trim() }),
    })
    if (res.ok) {
      const item = await res.json() as ChecklistItem
      setChecklists(prev => prev.map(c =>
        c.id === clId ? { ...c, items: [...c.items, item] } : c
      ))
      setNewItemLabel('')
      setAddingItemTo(null)
    }
  }

  async function updateItem(clId: string, itemId: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/tours/${tourId}/checklists/${clId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json() as ChecklistItem
      setChecklists(prev => prev.map(c =>
        c.id === clId ? { ...c, items: c.items.map(i => i.id === itemId ? updated : i) } : c
      ))
    }
  }

  async function deleteItem(clId: string, itemId: string) {
    const res = await fetch(`/api/tours/${tourId}/checklists/${clId}/items/${itemId}`, { method: 'DELETE' })
    if (res.ok) {
      setChecklists(prev => prev.map(c =>
        c.id === clId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
      ))
    }
  }

  const inputCls = 'px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">เช็คลิสต์เตรียมตัว ({checklists.length})</h2>
      </div>

      {checklists.length === 0 && !adding && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-gray-600 font-medium">ยังไม่มีเช็คลิสต์</p>
          <p className="text-gray-400 text-sm mt-1">เพิ่มรายการที่สมาชิกต้องเตรียมก่อนเดินทาง</p>
        </div>
      )}

      {checklists.map(cl => (
        <div key={cl.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">
              {cl.emoji && <span className="mr-1">{cl.emoji}</span>}
              {cl.title}
              <span className="text-gray-400 font-normal ml-1">({cl.items.length})</span>
            </h3>
            <button
              onClick={() => deleteChecklist(cl.id)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              ลบ
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {cl.items.map(item => (
              <div key={item.id} className="flex items-center gap-2 px-4 py-2.5 group">
                {editingItem === item.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          updateItem(cl.id, item.id, { label: editLabel.trim() })
                          setEditingItem(null)
                        }
                        if (e.key === 'Escape') setEditingItem(null)
                      }}
                      className={`flex-1 ${inputCls} text-xs`}
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        updateItem(cl.id, item.id, { label: editLabel.trim() })
                        setEditingItem(null)
                      }}
                      className="text-xs text-blue-600"
                    >
                      บันทึก
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs text-gray-300">☐</span>
                    <span className={`flex-1 text-sm text-gray-700 ${item.isImportant ? 'font-medium' : ''}`}>
                      {item.label}
                      {item.isImportant && <span className="text-red-500 ml-0.5">*</span>}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <button
                        onClick={() => updateItem(cl.id, item.id, { isImportant: !item.isImportant })}
                        className={`text-xs px-1.5 py-0.5 rounded ${item.isImportant ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                        title={item.isImportant ? 'ยกเลิกสำคัญ' : 'ทำเครื่องหมายสำคัญ'}
                      >
                        {item.isImportant ? '★' : '☆'}
                      </button>
                      <button
                        onClick={() => { setEditingItem(item.id); setEditLabel(item.label) }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                      </button>
                      <button
                        onClick={() => deleteItem(cl.id, item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add item */}
          {addingItemTo === cl.id ? (
            <div className="px-4 py-2 border-t border-gray-50 flex gap-2">
              <input
                type="text"
                value={newItemLabel}
                onChange={e => setNewItemLabel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addItem(cl.id)
                  if (e.key === 'Escape') { setAddingItemTo(null); setNewItemLabel('') }
                }}
                className={`flex-1 ${inputCls} text-xs`}
                placeholder="รายการใหม่..."
                autoFocus
              />
              <button
                onClick={() => addItem(cl.id)}
                disabled={!newItemLabel.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
              >
                เพิ่ม
              </button>
              <button
                onClick={() => { setAddingItemTo(null); setNewItemLabel('') }}
                className="px-2 py-1.5 text-gray-400 text-xs"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setAddingItemTo(cl.id); setNewItemLabel('') }}
              className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-t border-gray-50 transition-colors"
            >
              + เพิ่มรายการ
            </button>
          )}
        </div>
      ))}

      {/* Add new checklist */}
      {adding ? (
        <div className="bg-green-50 rounded-xl p-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newEmoji}
              onChange={e => setNewEmoji(e.target.value)}
              className={`w-14 text-center ${inputCls}`}
              placeholder="🎒"
            />
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addChecklist()}
              className={`flex-1 ${inputCls}`}
              placeholder="ชื่อเช็คลิสต์ เช่น สิ่งของที่ต้องเตรียม"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addChecklist}
              disabled={saving || !newTitle.trim()}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'กำลังสร้าง...' : 'สร้างเช็คลิสต์'}
            </button>
            <button
              onClick={() => { setAdding(false); setNewTitle(''); setNewEmoji('') }}
              className="px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-lg text-sm"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-xl text-sm hover:border-green-400 hover:text-green-600 transition-colors"
        >
          + เพิ่มเช็คลิสต์
        </button>
      )}
    </div>
  )
}
