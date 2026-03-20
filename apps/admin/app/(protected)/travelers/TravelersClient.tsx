'use client'

import { useState } from 'react'

interface Tour {
  id: string
  title: string
  startDate: string | Date
  primaryCountry: string
  isChina: boolean
  status: string
}

interface TourMembership {
  id: string
  role: string
  joinedAt: string | Date
  tour: Tour
}

interface Traveler {
  id: string
  name: string
  nameEn: string | null
  email: string
  phone: string | null
  avatarUrl: string | null
  passportExpiry: string | Date | null
  createdAt: string | Date
  tourMembers: TourMembership[]
}

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷',
  IT: '🇮🇹', GB: '🇬🇧', SG: '🇸🇬', AU: '🇦🇺', DE: '🇩🇪',
}

function passportExpiringSoon(expiry: string | Date | null) {
  if (!expiry) return false
  const d = new Date(expiry)
  const sixMonths = new Date()
  sixMonths.setMonth(sixMonths.getMonth() + 6)
  return d < sixMonths
}

interface Props {
  initialUsers: Traveler[]
  allTours: Tour[]
}

export default function TravelersClient({ initialUsers, allTours }: Props) {
  const [users, setUsers] = useState<Traveler[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Traveler | null>(null)

  // Add form state
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newNameEn, setNewNameEn] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  // Edit state
  const [editName, setEditName] = useState('')
  const [editNameEn, setEditNameEn] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Assign tour state
  const [assignTourId, setAssignTourId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone ?? '').includes(search)
  )

  function openDetail(user: Traveler) {
    setSelectedUser(user)
    setEditName(user.name)
    setEditNameEn(user.nameEn ?? '')
    setEditPhone(user.phone ?? '')
    setAssignTourId('')
  }

  async function addTraveler() {
    if (!newName.trim() || !newEmail.trim()) return
    setAdding(true)
    setAddError('')
    try {
      const res = await fetch('/api/travelers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), phone: newPhone.trim() || null, nameEn: newNameEn.trim() || null }),
      })
      const data = await res.json() as Traveler & { error?: string }
      if (!res.ok) { setAddError(data.error ?? 'เกิดข้อผิดพลาด'); return }
      setUsers((prev) => [data, ...prev])
      setNewName(''); setNewEmail(''); setNewPhone(''); setNewNameEn('')
      setShowAddForm(false)
    } finally {
      setAdding(false)
    }
  }

  async function saveEdit() {
    if (!selectedUser || !editName.trim()) return
    setEditSaving(true)
    const res = await fetch(`/api/travelers/${selectedUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), nameEn: editNameEn.trim() || null, phone: editPhone.trim() || null }),
    })
    if (res.ok) {
      const updated = await res.json() as Traveler
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u))
      setSelectedUser(updated)
    }
    setEditSaving(false)
  }

  async function deleteTraveler(userId: string) {
    if (!confirm('ลบนักเดินทางนี้ออกจากระบบ? จะถูกนำออกจากทุกทัวร์ด้วย')) return
    await fetch(`/api/travelers/${userId}`, { method: 'DELETE' })
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    if (selectedUser?.id === userId) setSelectedUser(null)
  }

  async function assignTour() {
    if (!selectedUser || !assignTourId) return
    setAssigning(true)
    const res = await fetch(`/api/travelers/${selectedUser.id}/tours`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tourId: assignTourId }),
    })
    if (res.ok) {
      const member = await res.json() as TourMembership
      const updatedUser: Traveler = {
        ...selectedUser,
        tourMembers: [member, ...selectedUser.tourMembers.filter((m) => m.tour.id !== assignTourId)],
      }
      setSelectedUser(updatedUser)
      setUsers((prev) => prev.map((u) => u.id === updatedUser.id ? updatedUser : u))
      setAssignTourId('')
    }
    setAssigning(false)
  }

  async function removeFromTour(tourId: string) {
    if (!selectedUser) return
    if (!confirm('นำนักเดินทางออกจากทัวร์นี้?')) return
    await fetch(`/api/travelers/${selectedUser.id}/tours`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tourId }),
    })
    const updatedUser: Traveler = {
      ...selectedUser,
      tourMembers: selectedUser.tourMembers.filter((m) => m.tour.id !== tourId),
    }
    setSelectedUser(updatedUser)
    setUsers((prev) => prev.map((u) => u.id === updatedUser.id ? updatedUser : u))
  }

  // Tours not yet assigned to selected user
  const unassignedTours = selectedUser
    ? allTours.filter((t) => !selectedUser.tourMembers.some((m) => m.tour.id === t.id))
    : allTours

  return (
    <div className="flex gap-6">
      {/* Left — list */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ อีเมล เบอร์โทร..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
          >
            + เพิ่มนักเดินทาง
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm mb-4 space-y-3">
            <h3 className="font-semibold text-gray-900">เพิ่มนักเดินทางใหม่</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">ชื่อ-นามสกุล (ภาษาไทย) *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="สมชาย ใจดี"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">ชื่อภาษาอังกฤษ (ตามพาสปอร์ต)</label>
                <input
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  placeholder="SOMCHAI JAIDEE"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">อีเมล *</label>
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  type="email"
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">เบอร์โทรศัพท์</label>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+66-81-000-0000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {addError && <p className="text-red-500 text-sm">{addError}</p>}
            <div className="flex gap-2">
              <button
                onClick={addTraveler}
                disabled={adding || !newName.trim() || !newEmail.trim()}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {adding ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setAddError('') }}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-gray-500 font-medium">ไม่พบนักเดินทาง</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="px-5 py-3 text-left">นักเดินทาง</th>
                  <th className="px-5 py-3 text-left">ทัวร์ที่เข้าร่วม</th>
                  <th className="px-5 py-3 text-left">พาสปอร์ต</th>
                  <th className="px-5 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => {
                  const expiring = passportExpiringSoon(user.passportExpiry)
                  const isSelected = selectedUser?.id === user.id
                  return (
                    <tr
                      key={user.id}
                      onClick={() => openDetail(user)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-600">
                            {user.avatarUrl
                              ? <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                              : user.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {user.tourMembers.length === 0 ? (
                            <span className="text-gray-400 text-xs">ยังไม่มีทัวร์</span>
                          ) : (
                            user.tourMembers.slice(0, 2).map((m) => (
                              <span key={m.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                <span>{countryFlags[m.tour.primaryCountry] ?? '🌍'}</span>
                                <span className="max-w-[100px] truncate">{m.tour.title}</span>
                              </span>
                            ))
                          )}
                          {user.tourMembers.length > 2 && (
                            <span className="text-xs text-gray-400">+{user.tourMembers.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {user.passportExpiry ? (
                          <span className={expiring ? 'text-red-500 font-medium' : 'text-gray-500'}>
                            {expiring ? '⚠️ ' : ''}
                            {new Date(user.passportExpiry).toLocaleDateString('th-TH')}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTraveler(user.id) }}
                          className="text-gray-300 hover:text-red-500 transition-colors text-xs px-2 py-1 rounded hover:bg-red-50"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right — detail panel */}
      {selectedUser && (
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-8 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium opacity-80">รายละเอียด</span>
                <button onClick={() => setSelectedUser(null)} className="text-white/60 hover:text-white text-lg leading-none">✕</button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                  {selectedUser.avatarUrl
                    ? <img src={selectedUser.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
                    : selectedUser.name[0]}
                </div>
                <div>
                  <p className="font-bold">{selectedUser.name}</p>
                  <p className="text-blue-200 text-xs">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Edit info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">แก้ไขข้อมูล</p>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="ชื่อ-นามสกุล ภาษาไทย"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  placeholder="ชื่อภาษาอังกฤษ"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="เบอร์โทรศัพท์"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={saveEdit}
                  disabled={editSaving || !editName.trim()}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {editSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>

              {/* Assign tour */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">เพิ่มเข้าทัวร์</p>
                {unassignedTours.length === 0 ? (
                  <p className="text-xs text-gray-400">เข้าร่วมทุกทัวร์แล้ว</p>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={assignTourId}
                      onChange={(e) => setAssignTourId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">เลือกทัวร์...</option>
                      {unassignedTours.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={assignTour}
                      disabled={assigning || !assignTourId}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {assigning ? 'กำลังเพิ่ม...' : '+ เพิ่มเข้าทัวร์นี้'}
                    </button>
                  </div>
                )}
              </div>

              {/* Tour list */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  ทัวร์ที่เข้าร่วม ({selectedUser.tourMembers.length})
                </p>
                {selectedUser.tourMembers.length === 0 ? (
                  <p className="text-xs text-gray-400">ยังไม่มีทัวร์</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedUser.tourMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="text-base">{countryFlags[m.tour.primaryCountry] ?? '🌍'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{m.tour.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(m.tour.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromTour(m.tour.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors text-xs flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteTraveler(selectedUser.id)}
                className="w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
              >
                ลบนักเดินทางนี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
