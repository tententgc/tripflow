'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

interface TourDay {
  id: string
  dayNumber: number
  date: string
}

interface Hotel {
  id: string
  name: string
  nameLocal: string | null
  address: string | null
  phone: string | null
  checkIn: string | null
  checkOut: string | null
  checkInDate: string | null
  checkOutDate: string | null
  confirmationNo: string | null
  wifiName: string | null
  wifiPassword: string | null
  roomType: string | null
  imageUrl: string | null
  notes: string | null
  dayNumbers: number[]
}

interface HotelForm {
  name: string
  nameLocal: string
  address: string
  phone: string
  checkIn: string
  checkOut: string
  checkInDate: string
  checkOutDate: string
  confirmationNo: string
  wifiName: string
  wifiPassword: string
  roomType: string
  imageUrl: string
  notes: string
}

const emptyForm: HotelForm = {
  name: '',
  nameLocal: '',
  address: '',
  phone: '',
  checkIn: '14:00',
  checkOut: '12:00',
  checkInDate: '',
  checkOutDate: '',
  confirmationNo: '',
  wifiName: '',
  wifiPassword: '',
  roomType: '',
  imageUrl: '',
  notes: '',
}

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export default function HotelsManager({
  tourId,
  initialHotels,
  tourDays,
}: {
  tourId: string
  initialHotels: Hotel[]
  tourDays: TourDay[]
}) {
  const [hotels, setHotels] = useState<Hotel[]>(initialHotels)
  const [showForm, setShowForm] = useState(false)
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)
  const [form, setForm] = useState<HotelForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)

  function openAdd() {
    setForm(emptyForm)
    setEditingHotel(null)
    setShowForm(true)
  }

  function openEdit(hotel: Hotel) {
    // If no checkInDate/checkOutDate stored, derive from dayNumbers
    let ciDate = toDateInput(hotel.checkInDate)
    let coDate = toDateInput(hotel.checkOutDate)
    if (!ciDate || !coDate) {
      const sortedDayNums = [...hotel.dayNumbers].sort((a, b) => a - b)
      const firstDayNum = sortedDayNums[0]
      const lastDayNum = sortedDayNums[sortedDayNums.length - 1]
      const firstDay = tourDays.find(d => d.dayNumber === firstDayNum)
      const lastDay = tourDays.find(d => d.dayNumber === lastDayNum)
      if (firstDay) ciDate = toDateInput(firstDay.date)
      if (lastDay) {
        // Check-out = day after last stay night
        const co = new Date(lastDay.date)
        co.setDate(co.getDate() + 1)
        coDate = co.toISOString().slice(0, 10)
      }
    }

    setForm({
      name: hotel.name,
      nameLocal: hotel.nameLocal ?? '',
      address: hotel.address ?? '',
      phone: hotel.phone ?? '',
      checkIn: hotel.checkIn ?? '14:00',
      checkOut: hotel.checkOut ?? '12:00',
      checkInDate: ciDate,
      checkOutDate: coDate,
      confirmationNo: hotel.confirmationNo ?? '',
      wifiName: hotel.wifiName ?? '',
      wifiPassword: hotel.wifiPassword ?? '',
      roomType: hotel.roomType ?? '',
      imageUrl: hotel.imageUrl ?? '',
      notes: hotel.notes ?? '',
    })
    setEditingHotel(hotel)
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditingHotel(null)
    setForm(emptyForm)
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setForm(p => ({ ...p, imageUrl: data.url }))
      }
    } finally {
      setUploadingImg(false)
    }
  }

  async function save() {
    if (!form.name.trim() || !form.checkInDate || !form.checkOutDate) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tours/${tourId}/hotels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          checkInDate: new Date(form.checkInDate).toISOString(),
          checkOutDate: new Date(form.checkOutDate).toISOString(),
          previousName: editingHotel?.name,
        }),
      })
      if (res.ok) {
        // Refresh hotel list
        await refreshHotels()
        cancel()
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteHotel(hotel: Hotel) {
    if (!confirm(`ลบที่พัก "${hotel.name}" ออกจากทุกวัน?`)) return
    setDeleting(hotel.id)
    try {
      const res = await fetch(`/api/tours/${tourId}/hotels/${encodeURIComponent(hotel.name)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setHotels(prev => prev.filter(h => h.id !== hotel.id))
      }
    } finally {
      setDeleting(null)
    }
  }

  async function refreshHotels() {
    const res = await fetch(`/api/tours/${tourId}/hotels`)
    if (res.ok) {
      const data = await res.json()
      setHotels(data.hotels)
    }
  }

  // Calculate which days a date range covers
  function getMatchingDayNumbers(): number[] {
    if (!form.checkInDate || !form.checkOutDate) return []
    const ci = new Date(form.checkInDate)
    const co = new Date(form.checkOutDate)
    return tourDays
      .filter(d => {
        const dayDate = new Date(d.date)
        const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate())
        const ciStart = new Date(ci.getFullYear(), ci.getMonth(), ci.getDate())
        const coStart = new Date(co.getFullYear(), co.getMonth(), co.getDate())
        return dayStart >= ciStart && dayStart < coStart
      })
      .map(d => d.dayNumber)
  }

  const matchingDays = getMatchingDayNumbers()

  // Get date range for the tour
  const firstDay = tourDays[0]
  const lastDay = tourDays[tourDays.length - 1]
  const tourStartDate = firstDay ? toDateInput(firstDay.date) : ''
  const tourEndDate = lastDay ? toDateInput(lastDay.date) : ''

  return (
    <div className="space-y-4">
      {/* Hotel List */}
      {hotels.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-3xl mb-2">🏨</p>
          <p className="text-gray-600 font-medium">ยังไม่มีที่พัก</p>
          <p className="text-gray-400 text-sm mt-1">เพิ่มโรงแรมแล้วระบบจะจัดวันให้อัตโนมัติ</p>
          <button
            onClick={openAdd}
            className="mt-4 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            + เพิ่มที่พัก
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {hotels.map(hotel => (
              <div key={hotel.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 p-4">
                  {/* Hotel Image */}
                  {hotel.imageUrl ? (
                    <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-gray-100">
                      <img src={hotel.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-16 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🏨</span>
                    </div>
                  )}

                  {/* Hotel Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                        {hotel.nameLocal && <p className="text-xs text-gray-400 mt-0.5">{hotel.nameLocal}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEdit(hotel)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteHotel(hotel)}
                          disabled={deleting === hotel.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="ลบ"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Date & Details */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                      {hotel.checkInDate && hotel.checkOutDate && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          {new Date(hotel.checkInDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} — {new Date(hotel.checkOutDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {hotel.checkIn && (
                        <span>เช็คอิน {hotel.checkIn}</span>
                      )}
                      {hotel.checkOut && (
                        <span>เช็คเอาต์ {hotel.checkOut}</span>
                      )}
                      {hotel.confirmationNo && (
                        <span className="font-mono">#{hotel.confirmationNo}</span>
                      )}
                    </div>

                    {/* Day badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hotel.dayNumbers.map(n => (
                        <span key={n} className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full font-medium">
                          วันที่ {n}
                        </span>
                      ))}
                      <span className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded-full">
                        {hotel.dayNumbers.length} คืน
                      </span>
                    </div>

                    {/* Extra info row */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {hotel.wifiName && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
                          {hotel.wifiName}
                        </span>
                      )}
                      {hotel.roomType && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full">
                          {hotel.roomType}
                        </span>
                      )}
                      {hotel.phone && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full">
                          {hotel.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!showForm && (
            <button
              onClick={openAdd}
              className="w-full py-3 border-2 border-dashed border-violet-300 text-violet-600 rounded-2xl text-sm font-medium hover:bg-violet-50 hover:border-violet-400 transition-colors"
            >
              + เพิ่มที่พัก
            </button>
          )}
        </>
      )}

      {/* Add/Edit Form — Modal */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={cancel} />

          {/* Centering wrapper */}
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Modal — horizontal layout */}
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between bg-violet-50 px-5 py-3.5 border-b border-violet-100">
                <h3 className="font-semibold text-violet-800 text-sm">
                  {editingHotel ? `แก้ไข "${editingHotel.name}"` : 'เพิ่มที่พักใหม่'}
                </h3>
                <button onClick={cancel} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-violet-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 max-h-[75vh] overflow-y-auto">
                {/* Left column — Image + Name + Dates */}
                <div className="p-5 space-y-4 border-r border-gray-100">
                  {/* Image Upload */}
                  <input ref={imgRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={uploadImage} className="hidden" />
                  {form.imageUrl ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-violet-200">
                      <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, imageUrl: '' }))}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70"
                      >✕</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imgRef.current?.click()}
                      disabled={uploadingImg}
                      className="w-full h-28 border border-dashed border-violet-300 rounded-xl flex items-center justify-center hover:border-violet-400 transition-colors bg-violet-50/50"
                    >
                      {uploadingImg ? (
                        <span className="text-sm text-violet-400">กำลังอัพโหลด...</span>
                      ) : (
                        <div className="text-center">
                          <span className="text-2xl">📷</span>
                          <p className="text-xs text-violet-400 mt-1">อัพโหลดรูปโรงแรม</p>
                        </div>
                      )}
                    </button>
                  )}
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                    placeholder="หรือวาง URL รูปภาพ"
                  />

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อโรงแรม *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                      placeholder="เช่น Holiday Inn Beijing"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อภาษาท้องถิ่น</label>
                    <input
                      type="text"
                      value={form.nameLocal}
                      onChange={e => setForm(p => ({ ...p, nameLocal: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                      placeholder="เช่น 北京假日酒店"
                    />
                  </div>

                  {/* Dates */}
                  <div className="bg-violet-50 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-violet-700 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      วันเข้าพัก
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-violet-600 mb-1">วันเช็คอิน *</label>
                        <input type="date" value={form.checkInDate} min={tourStartDate} max={tourEndDate}
                          onChange={e => setForm(p => ({ ...p, checkInDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-violet-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-violet-600 mb-1">วันเช็คเอาต์ *</label>
                        <input type="date" value={form.checkOutDate} min={form.checkInDate || tourStartDate}
                          max={lastDay ? (() => { const d = new Date(lastDay.date); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })() : ''}
                          onChange={e => setForm(p => ({ ...p, checkOutDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-violet-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-violet-600 mb-1">เวลาเช็คอิน</label>
                        <input type="time" value={form.checkIn} onChange={e => setForm(p => ({ ...p, checkIn: e.target.value }))}
                          className="w-full px-3 py-2 border border-violet-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-violet-600 mb-1">เวลาเช็คเอาต์</label>
                        <input type="time" value={form.checkOut} onChange={e => setForm(p => ({ ...p, checkOut: e.target.value }))}
                          className="w-full px-3 py-2 border border-violet-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
                      </div>
                    </div>
                    {matchingDays.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-violet-500 font-medium">จะใส่ให้:</span>
                        <div className="flex flex-wrap gap-1">
                          {matchingDays.map(n => (
                            <span key={n} className="text-[10px] px-2 py-0.5 bg-violet-200 text-violet-700 rounded-full font-medium">วันที่ {n}</span>
                          ))}
                        </div>
                        <span className="text-[10px] text-violet-400">({matchingDays.length} คืน)</span>
                      </div>
                    )}
                    {form.checkInDate && form.checkOutDate && matchingDays.length === 0 && (
                      <p className="text-[10px] text-red-500 font-medium pt-1">ไม่มีวันที่ตรงกับทริป</p>
                    )}
                  </div>
                </div>

                {/* Right column — Details + WiFi + Notes + Actions */}
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ที่อยู่</label>
                    <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                      placeholder="ที่อยู่โรงแรม" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">เบอร์โทร</label>
                      <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                        placeholder="เบอร์โทร" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">ประเภทห้อง</label>
                      <input type="text" value={form.roomType} onChange={e => setForm(p => ({ ...p, roomType: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                        placeholder="เช่น Superior Double" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Confirmation No.</label>
                    <input type="text" value={form.confirmationNo} onChange={e => setForm(p => ({ ...p, confirmationNo: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                      placeholder="เลขที่ยืนยันการจอง" />
                  </div>

                  {/* WiFi */}
                  <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
                      WiFi โรงแรม
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-blue-600 mb-1">ชื่อ WiFi</label>
                        <input type="text" value={form.wifiName} onChange={e => setForm(p => ({ ...p, wifiName: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-blue-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          placeholder="Hotel_WiFi" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-blue-600 mb-1">รหัส WiFi</label>
                        <input type="text" value={form.wifiPassword} onChange={e => setForm(p => ({ ...p, wifiPassword: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-blue-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                          placeholder="password123" />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">หมายเหตุ</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 resize-none"
                      placeholder="หมายเหตุเพิ่มเติม" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button onClick={save}
                      disabled={saving || !form.name.trim() || !form.checkInDate || !form.checkOutDate || matchingDays.length === 0}
                      className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-violet-700 transition-colors">
                      {saving ? 'กำลังบันทึก...' : editingHotel ? 'อัปเดตที่พัก' : 'เพิ่มที่พัก'}
                    </button>
                    <button onClick={cancel}
                      className="px-5 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Info note */}
      {hotels.length > 0 && !showForm && (
        <div className="bg-violet-50/50 rounded-xl p-3 border border-violet-100">
          <p className="text-xs text-violet-600">
            <span className="font-medium">Tip:</span> เพิ่มโรงแรมพร้อมวันเช็คอิน-เช็คเอาต์ ระบบจะใส่ที่พักให้แต่ละวันอัตโนมัติ
            ข้อมูลจะแสดงในแอปนักเดินทางตามวันที่ถูกต้อง
          </p>
        </div>
      )}
    </div>
  )
}
