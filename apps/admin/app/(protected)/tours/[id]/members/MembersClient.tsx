'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

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

  const [allUsers, setAllUsers] = useState<UserResult[]>([])
  const [loadedAll, setLoadedAll] = useState(false)

  // Load all users once on first focus
  async function loadAllUsers() {
    if (loadedAll) return
    try {
      const res = await fetch('/api/travelers?simple=1')
      const data = await res.json() as UserResult[]
      setAllUsers(data)
      setLoadedAll(true)
    } catch {
      // ignore
    }
  }

  // Filter results based on query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const memberIds = new Set(members.map((m) => m.user.id))

    if (!query.trim()) {
      setResults(allUsers.filter((u) => !memberIds.has(u.id)))
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/travelers?simple=1&q=${encodeURIComponent(query)}`)
        const data = await res.json() as UserResult[]
        setResults(data.filter((u) => !memberIds.has(u.id)))
        setShowDropdown(true)
      } catch {
        // ignore search errors
      }
    }, 250)
  }, [query, members, allUsers])

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
    <div className="space-y-5">
      {/* Add member — glass card with indigo accent */}
      <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
          </div>
          <h2 className="font-semibold text-gray-900 text-sm">เพิ่มสมาชิก</h2>
        </div>
        <div className="relative" ref={wrapperRef}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { loadAllUsers(); setShowDropdown(true) }}
              placeholder="ค้นหาจากชื่อ, อีเมล, หรือเบอร์โทร..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-sm border border-indigo-100 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            />
            {adding && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-400">กำลังเพิ่ม...</span>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-100/50 z-50 max-h-64 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-4 py-4 text-sm text-gray-400 text-center">
                  {!loadedAll ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      กำลังโหลด...
                    </span>
                  ) : 'ไม่พบผู้ใช้ที่ยังไม่ได้เป็นสมาชิก'}
                </div>
              ) : (
                results.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => addMemberById(u.id)}
                    disabled={adding}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/70 transition-colors text-left border-b border-gray-100/60 last:border-0 disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-indigo-200/50">
                      {u.avatarUrl ? (
                        <Image src={u.avatarUrl} alt="" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <span className="text-indigo-600 font-semibold text-xs">{u.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                    </div>
                    <span className="text-indigo-600 text-xs font-medium flex-shrink-0 px-2.5 py-1 rounded-lg bg-indigo-100/70">+ เพิ่ม</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        <p className="text-xs text-gray-400 mt-2">พิมพ์ชื่อหรืออีเมลเพื่อค้นหาผู้ใช้ที่มีในระบบ</p>
      </div>

      {/* Members list — glass card */}
      <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-indigo-100/40 flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{members.length} สมาชิก</p>
        </div>
        {members.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium text-sm">ยังไม่มีสมาชิก</p>
            <p className="text-gray-400 text-xs mt-1">ค้นหาสมาชิกด้านบน</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100/60">
            {members.map((m, idx) => {
              const expiringSoon = isPassportExpiringSoon(m.user.passportExpiry)
              return (
                <div key={m.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3.5 px-3 sm:px-5 py-3 sm:py-3.5 hover:bg-indigo-50/30 transition-colors group">
                  <span className="text-xs text-gray-500 w-4 text-right font-mono flex-shrink-0 hidden sm:block">{idx + 1}</span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                    {m.user.avatarUrl ? (
                      <Image src={m.user.avatarUrl} alt="" width={40} height={40} className="w-full h-full rounded-full object-cover" unoptimized />
                    ) : (
                      <span className="text-indigo-600 font-semibold text-sm">{m.user.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">{m.user.name}</p>
                      {m.role === 'LEADER' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-semibold">ผู้นำกลุ่ม</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs">
                    {m.roomNo && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-indigo-50/70 text-indigo-600 rounded-lg">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                        {m.roomNo}
                      </span>
                    )}
                    {m.seatNo && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-indigo-50/70 text-indigo-600 rounded-lg">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                        {m.seatNo}
                      </span>
                    )}
                    {m.user.passportExpiry && (
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg ${expiringSoon ? 'bg-red-50 text-red-600 font-medium' : 'bg-gray-50 text-gray-500'}`}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm-3.375 6.166a3.001 3.001 0 015.003.006" /></svg>
                        {new Date(m.user.passportExpiry).toLocaleDateString('th-TH')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeMember(m.user.id)}
                    className="p-1.5 text-gray-400 sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="ลบสมาชิก"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
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
