'use client'

import { useState, useEffect, useRef } from 'react'

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

interface UserResult {
  id: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
}

export default function MembersClient({ tourId, initialMembers }: { tourId: string; initialMembers: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Search users as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/travelers?simple=1&q=${encodeURIComponent(query)}`)
        const data = await res.json() as UserResult[]
        // Filter out already-added members
        const memberIds = new Set(members.map((m) => m.user.id))
        setResults(data.filter((u) => !memberIds.has(u.id)))
        setShowDropdown(true)
      } catch {
        // ignore search errors
      }
    }, 250)
  }, [query, members])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function addMemberById(userId: string) {
    setAdding(true)
    setError('')
    try {
      const res = await fetch(`/api/tours/${tourId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'เกิดข้อผิดพลาด')
        return
      }
      const member = await res.json() as Member
      setMembers((prev) => [...prev, member])
      setQuery('')
      setResults([])
      setShowDropdown(false)
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
        <div className="relative" ref={wrapperRef}>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setShowDropdown(true)}
                placeholder="ค้นหาจากชื่อ, อีเมล, หรือเบอร์โทร..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {adding && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">กำลังเพิ่ม...</span>
              )}
            </div>
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-64 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">ไม่พบผู้ใช้</div>
              ) : (
                results.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => addMemberById(u.id)}
                    disabled={adding}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0 disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-600 font-semibold text-xs">{u.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                    </div>
                    <span className="text-blue-500 text-xs font-medium flex-shrink-0">+ เพิ่ม</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <p className="text-xs text-gray-400 mt-2">พิมพ์ชื่อหรืออีเมลเพื่อค้นหาผู้ใช้ที่มีในระบบ</p>
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
            <p className="text-gray-400 text-sm mt-1">ค้นหาสมาชิกด้านบน</p>
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
