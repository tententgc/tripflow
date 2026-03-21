'use client'

import { useState } from 'react'

interface StaffMember {
  id: string
  role: string
  userName: string
  userEmail: string
}

const roleLabels: Record<string, { label: string; color: string }> = {
  OWNER: { label: 'เจ้าของ', color: 'bg-amber-100 text-amber-700' },
  MANAGER: { label: 'ผู้จัดการ', color: 'bg-blue-100 text-blue-700' },
  STAFF: { label: 'เจ้าหน้าที่', color: 'bg-gray-100 text-gray-600' },
}

export default function StaffManager({ initialStaff }: { initialStaff: StaffMember[] }) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [adding, setAdding] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('STAFF')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function addStaff() {
    if (!email.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/settings/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'เกิดข้อผิดพลาด')
        return
      }
      setStaff(prev => [...prev, {
        id: data.id,
        role: data.role,
        userName: data.user.name,
        userEmail: data.user.email,
      }])
      setEmail('')
      setRole('STAFF')
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  async function removeStaff(staffId: string) {
    if (!confirm('นำผู้ดูแลนี้ออก?')) return
    const res = await fetch('/api/settings/staff', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId }),
    })
    if (res.ok) setStaff(prev => prev.filter(s => s.id !== staffId))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-sm">👥</div>
          <h2 className="font-bold text-gray-900 text-sm">ทีมผู้ดูแล ({staff.length})</h2>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="text-xs text-indigo-600 font-semibold hover:underline">
            + เพิ่มผู้ดูแล
          </button>
        )}
      </div>

      {/* Staff list */}
      <div className="divide-y divide-gray-50">
        {staff.map(s => {
          const rl = roleLabels[s.role] ?? roleLabels['STAFF']!
          return (
            <div key={s.id} className="px-6 py-3 flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                {s.userName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{s.userName}</p>
                <p className="text-xs text-gray-400">{s.userEmail}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rl.color}`}>
                {rl.label}
              </span>
              {s.role !== 'OWNER' && (
                <button
                  onClick={() => removeStaff(s.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all text-xs p-1 rounded hover:bg-red-50"
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Add form */}
      {adding && (
        <div className="px-6 py-4 border-t border-gray-100 bg-indigo-50/30 space-y-3">
          <p className="text-xs font-bold text-indigo-700">เพิ่มผู้ดูแลใหม่</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStaff()}
              placeholder="admin@example.com"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              autoFocus
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="STAFF">เจ้าหน้าที่</option>
              <option value="MANAGER">ผู้จัดการ</option>
              <option value="OWNER">เจ้าของ</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={addStaff} disabled={saving || !email.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
              {saving ? 'กำลังเพิ่ม...' : 'เพิ่มผู้ดูแล'}
            </button>
            <button onClick={() => { setAdding(false); setError('') }} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs">
              ยกเลิก
            </button>
          </div>
          <p className="text-[10px] text-gray-400">ผู้ดูแลจะต้อง login ด้วยอีเมลนี้จึงจะเข้า Admin Portal ได้</p>
        </div>
      )}
    </div>
  )
}
