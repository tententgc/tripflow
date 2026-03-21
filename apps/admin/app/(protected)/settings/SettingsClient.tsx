'use client'

import { useState } from 'react'

interface OperatorInfo {
  id: string
  name: string
  nameEn: string | null
  email: string
  phone: string | null
  lineId: string | null
  website: string | null
}

export default function SettingsClient({ operator }: { operator: OperatorInfo }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: operator.name,
    nameEn: operator.nameEn ?? '',
    email: operator.email,
    phone: operator.phone ?? '',
    lineId: operator.lineId ?? '',
    website: operator.website ?? '',
  })
  const [current, setCurrent] = useState(operator)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/settings/operator`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          nameEn: form.nameEn.trim() || null,
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          lineId: form.lineId.trim() || null,
          website: form.website.trim() || null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCurrent(updated)
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50'

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">ชื่อบริษัท (ไทย)</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">ชื่อบริษัท (EN)</label>
            <input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">อีเมล</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">เบอร์โทร</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+66-2-000-0000" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">LINE ID</label>
            <input value={form.lineId} onChange={e => setForm(p => ({ ...p, lineId: e.target.value }))} className={inputCls} placeholder="@tripflow" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">เว็บไซต์</label>
            <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className={inputCls} placeholder="https://..." />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={save} disabled={saving || !form.name.trim()} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
            {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
          </button>
          <button onClick={() => setEditing(false)} className="px-5 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm">ยกเลิก</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'ชื่อบริษัท', value: current.name, icon: '🏢' },
          { label: 'ชื่อ EN', value: current.nameEn ?? '-', icon: '🌐' },
          { label: 'อีเมล', value: current.email, icon: '📧' },
          { label: 'เบอร์โทร', value: current.phone ?? '-', icon: '📞' },
          { label: 'LINE', value: current.lineId ?? '-', icon: '💬' },
          { label: 'เว็บไซต์', value: current.website ?? '-', icon: '🔗' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg">
            <span className="text-sm">{item.icon}</span>
            <div>
              <p className="text-[10px] text-gray-400">{item.label}</p>
              <p className="text-sm text-gray-800 font-medium">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setEditing(true)} className="mt-4 text-xs text-indigo-600 font-medium hover:underline">
        ✏️ แก้ไขข้อมูลบริษัท
      </button>
    </div>
  )
}
