'use client'

import { useState } from 'react'

interface Member {
  id: string
  role: string
  seatNo: string | null
  roomNo: string | null
  joinedAt: string | Date
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    avatarUrl: string | null
    passportExpiry: string | Date | null
  }
}

export default function MembersClient({ tourId, initialMembers }: { tourId: string; initialMembers: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function addMember() {
    if (!email.trim()) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch(`/api/tours/${tourId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'เกิดข้อผิดพลาด')
        return
      }
      const member = await res.json() as Member
      setMembers((prev) => [...prev, member])
      setEmail('')
    } finally {
      setAdding(false)
    }
  }

  async function removeMember(userId: string) {
    if (!confirm('ต้องการลบสมาชิกนี้ออกจากทัวร์?')) return
    await fetch(`/api/tours/${tourId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    setMembers((prev) => prev.filter((m) => m.user.id !== userId))
  }

  function isPassportExpiringSoon(expiry: string | Date | null) {
    if (!expiry) return false
    const d = new Date(expiry)
    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
    return d < sixMonthsFromNow
  }

  return (
    <div className="space-y-6">
      {/* Add member form */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">เพิ่มสมาชิก</h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMember()}
            placeholder="อีเมลของสมาชิก"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addMember}
            disabled={adding || !email.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? 'กำลังเพิ่ม...' : '+ เพิ่ม'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <p className="text-xs text-gray-400 mt-2">ถ้าอีเมลนี้ยังไม่มีบัญชี ระบบจะสร้างให้อัตโนมัติ</p>
      </div>

      {/* Members table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">{members.length} สมาชิก</p>
        </div>
        {members.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500 font-medium">ยังไม่มีสมาชิก</p>
            <p className="text-gray-400 text-sm mt-1">เพิ่มสมาชิกด้วยอีเมลด้านบน</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {members.map((m) => {
              const expiringSoon = isPassportExpiringSoon(m.user.passportExpiry)
              return (
                <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {m.user.avatarUrl ? (
                      <img src={m.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-gray-600 font-semibold">{m.user.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{m.user.name}</p>
                      {m.role === 'LEADER' && (
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">ผู้นำกลุ่ม</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{m.user.email}</p>
                    {m.user.phone && <p className="text-xs text-gray-400">{m.user.phone}</p>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {m.roomNo && <span>🛏 {m.roomNo}</span>}
                    {m.seatNo && <span>💺 {m.seatNo}</span>}
                    {m.user.passportExpiry && (
                      <span className={expiringSoon ? 'text-red-500 font-medium' : ''}>
                        {expiringSoon ? '⚠️' : '🛂'} {new Date(m.user.passportExpiry!).toLocaleDateString('th-TH')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeMember(m.user.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors text-sm ml-2"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
