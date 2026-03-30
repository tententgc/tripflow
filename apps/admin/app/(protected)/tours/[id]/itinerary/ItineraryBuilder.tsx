'use client'

import { useState, useRef, useCallback } from 'react'

interface Activity {
  id: string
  time: string | null
  title: string
  titleLocal: string | null
  description: string | null
  category: string
  order: number
  imageUrls: string[]
}

interface Day {
  id: string
  dayNumber: number
  date: string | Date
  title: string
  city: string | null
  country: string | null
  mealBreakfast: boolean
  mealLunch: boolean
  mealDinner: boolean
  activities: Activity[]
  accommodation: {
    id: string
    name: string
    nameLocal: string | null
    address: string | null
    phone: string | null
    checkIn: string | null
    checkOut: string | null
    confirmationNo: string | null
    wifiName: string | null
    wifiPassword: string | null
    roomType: string | null
    imageUrl: string | null
    notes: string | null
  } | null
}

interface Tour {
  id: string
  title: string
  startDate: string | Date
  endDate: string | Date
  isChina: boolean
  days: Day[]
}

const categoryOptions = [
  { value: 'SIGHTSEEING', label: 'สถานที่ท่องเที่ยว', emoji: '🏛️', color: 'bg-indigo-100 text-indigo-600' },
  { value: 'FOOD', label: 'อาหาร', emoji: '🍜', color: 'bg-orange-100 text-orange-600' },
  { value: 'TRANSPORT', label: 'การเดินทาง', emoji: '🚌', color: 'bg-sky-100 text-sky-600' },
  { value: 'ACCOMMODATION', label: 'ที่พัก', emoji: '🏨', color: 'bg-violet-100 text-violet-600' },
  { value: 'SHOPPING', label: 'ช้อปปิ้ง', emoji: '🛍️', color: 'bg-pink-100 text-pink-600' },
  { value: 'TEMPLE', label: 'วัด/ศาสนสถาน', emoji: '⛩️', color: 'bg-amber-100 text-amber-600' },
  { value: 'NATURE', label: 'ธรรมชาติ', emoji: '🌿', color: 'bg-emerald-100 text-emerald-600' },
  { value: 'OTHER', label: 'อื่นๆ', emoji: '📍', color: 'bg-gray-100 text-gray-600' },
]

type EditState = {
  time: string
  title: string
  titleLocal: string
  description: string
  category: string
  imageUrls: string[]
  googleMapUrl: string
}

// ── Image Manager ─────────────────────────────────────────────────────────────
function ImageManager({
  images,
  onChange,
}: {
  images: string[]
  onChange: (imgs: string[]) => void
}) {
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [urlMode, setUrlMode] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFiles(files: FileList) {
    setUploading(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const { url } = await res.json() as { url: string }
          uploaded.push(url)
        }
      } catch { /* skip failed */ }
    }
    setUploading(false)
    if (uploaded.length) onChange([...images, ...uploaded])
  }

  function addUrl() {
    const url = urlInput.trim()
    if (!url || images.includes(url)) { setUrlInput(''); return }
    onChange([...images, url])
    setUrlInput('')
    setUrlMode(false)
  }

  function remove(idx: number) {
    onChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative group">
              <img
                src={src}
                alt=""
                className="w-20 h-16 rounded-lg object-cover border border-gray-200"
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="64"><rect fill="%23f3f4f6" width="80" height="64"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20">🖼️</text></svg>' }}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Add controls */}
      {urlMode ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addUrl()}
            placeholder="วาง URL รูปภาพจากอินเทอร์เน็ต..."
            autoFocus
            className="flex-1 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!urlInput.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >เพิ่ม</button>
          <button
            type="button"
            onClick={() => { setUrlMode(false); setUrlInput('') }}
            className="px-3 py-2 border border-gray-200 bg-white text-gray-500 rounded-lg text-sm"
          >✕</button>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Upload */}
          <label className={`flex-1 flex items-center justify-center gap-1.5 py-2 border border-dashed rounded-lg text-xs cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-wait border-gray-300 text-gray-400' : 'border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600'}`}>
            <span>📁</span>
            <span>{uploading ? 'กำลังอัพโหลด...' : 'อัพโหลดรูป'}</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files) }}
            />
          </label>
          {/* URL */}
          <button
            type="button"
            onClick={() => setUrlMode(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600 rounded-lg text-xs transition-colors"
          >
            <span>🔗</span>
            <span>ใส่ URL จากอินเทอร์เน็ต</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Activity Form ─────────────────────────────────────────────────────────────
function ActivityForm({
  initial,
  tourId,
  dayId,
  activityId,
  isChina,
  onSave,
  onCancel,
  onDelete,
  submitLabel,
}: {
  initial: EditState
  tourId: string
  dayId: string
  activityId?: string
  isChina: boolean
  onSave: (activity: Activity) => void
  onCancel: () => void
  onDelete?: () => void
  submitLabel: string
}) {
  const [form, setForm] = useState<EditState>(initial)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const url = activityId
        ? `/api/tours/${tourId}/days/${dayId}/activities/${activityId}`
        : `/api/tours/${tourId}/days/${dayId}/activities`
      const res = await fetch(url, {
        method: activityId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: form.time || null,
          title: form.title.trim(),
          titleLocal: form.titleLocal.trim() || null,
          description: form.description.trim() || null,
          category: form.category,
          imageUrls: form.imageUrls,
          googleMapUrl: form.googleMapUrl.trim() || null,
        }),
      })
      if (res.ok) onSave(await res.json() as Activity)
    } finally {
      setSaving(false)
    }
  }

  async function deleteActivity() {
    if (!activityId || !confirm('ลบกิจกรรมนี้?')) return
    setDeleting(true)
    try {
      await fetch(`/api/tours/${tourId}/days/${dayId}/activities/${activityId}`, { method: 'DELETE' })
      onDelete?.()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-blue-50 rounded-xl p-3 space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <input
          type="time"
          value={form.time}
          onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
          className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className="col-span-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="ชื่อกิจกรรม (ภาษาไทย) *"
          autoFocus
        />
      </div>
      <input
        type="text"
        value={form.titleLocal}
        onChange={(e) => setForm((p) => ({ ...p, titleLocal: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder={isChina ? 'ชื่อภาษาจีน (故宫博物院)' : 'ชื่อภาษาท้องถิ่น (英語名)'}
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        rows={3}
        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        placeholder="คำอธิบายกิจกรรม เช่น รายละเอียด สิ่งที่น่าสนใจ ทิปส์ต่างๆ..."
      />
      <select
        value={form.category}
        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {categoryOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
        ))}
      </select>

      {/* Google Maps URL */}
      <div className="relative">
        <input
          value={form.googleMapUrl}
          onChange={(e) => setForm((p) => ({ ...p, googleMapUrl: e.target.value }))}
          className="w-full px-3 py-2 pl-9 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="วาง Google Maps link (เช่น https://maps.app.goo.gl/...)"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📍</span>
        {form.googleMapUrl && (
          <a href={form.googleMapUrl} target="_blank" rel="noopener noreferrer"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-700 font-medium">
            เปิดแผนที่ ↗
          </a>
        )}
      </div>

      {/* Multi-image manager */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <p className="text-xs text-gray-500 mb-2">รูปภาพสถานที่ <span className="text-gray-400">({form.imageUrls.length} รูป)</span></p>
        <ImageManager
          images={form.imageUrls}
          onChange={(imgs) => setForm((p) => ({ ...p, imageUrls: imgs }))}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving || !form.title.trim()}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'กำลังบันทึก...' : submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-lg text-sm"
        >
          ยกเลิก
        </button>
        {activityId && (
          <button
            onClick={deleteActivity}
            disabled={deleting}
            className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm disabled:opacity-50"
            title="ลบกิจกรรม"
          ><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
        )}
      </div>
    </div>
  )
}

// ── Main Builder ──────────────────────────────────────────────────────────────
export default function ItineraryBuilder({ tour }: { tour: Tour }) {
  const [days, setDays] = useState<Day[]>(tour.days)
  const [addingActivity, setAddingActivity] = useState<string | null>(null)
  const [editingActivity, setEditingActivity] = useState<string | null>(null)
  const [addingDay, setAddingDay] = useState(false)
  const [editingDayHeader, setEditingDayHeader] = useState<string | null>(null)
  const [dayHeaderForm, setDayHeaderForm] = useState({ title: '', city: '' })

  // Drag and drop state
  const [dragItem, setDragItem] = useState<{ dayId: string; actIndex: number } | null>(null)
  const [dragOverItem, setDragOverItem] = useState<{ dayId: string; actIndex: number } | null>(null)

  const handleDragStart = useCallback((dayId: string, actIndex: number) => {
    setDragItem({ dayId, actIndex })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, dayId: string, actIndex: number) => {
    e.preventDefault()
    setDragOverItem({ dayId, actIndex })
  }, [])

  const handleDrop = useCallback(async (dayId: string) => {
    if (!dragItem || !dragOverItem || dragItem.dayId !== dayId || dragItem.actIndex === dragOverItem.actIndex) {
      setDragItem(null)
      setDragOverItem(null)
      return
    }

    // Reorder locally
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d
      const acts = [...d.activities]
      const [moved] = acts.splice(dragItem.actIndex, 1)
      if (moved) acts.splice(dragOverItem.actIndex, 0, moved)
      return { ...d, activities: acts.map((a, i) => ({ ...a, order: i })) }
    }))

    // Save to server
    const day = days.find(d => d.id === dayId)
    if (day) {
      const acts = [...day.activities]
      const [moved] = acts.splice(dragItem.actIndex, 1)
      if (moved) acts.splice(dragOverItem.actIndex, 0, moved)
      fetch(`/api/tours/${tour.id}/days/${dayId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityIds: acts.map(a => a.id) }),
      }).catch(() => {})
    }

    setDragItem(null)
    setDragOverItem(null)
  }, [dragItem, dragOverItem, days, tour.id])

  async function addDay() {
    setAddingDay(true)
    const nextDayNumber = days.length + 1
    const startDate = new Date(tour.startDate)
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + nextDayNumber - 1)
    try {
      const res = await fetch(`/api/tours/${tour.id}/days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: nextDayNumber,
          date: dayDate.toISOString(),
          title: `วันที่ ${nextDayNumber}`,
          mealBreakfast: false,
          mealLunch: false,
          mealDinner: false,
        }),
      })
      if (res.ok) {
        const day = await res.json()
        setDays((prev) => [...prev, { ...day, activities: [], accommodation: null }])
      }
    } finally {
      setAddingDay(false)
    }
  }

  async function updateMeals(dayId: string, field: 'mealBreakfast' | 'mealLunch' | 'mealDinner', value: boolean) {
    await fetch(`/api/tours/${tour.id}/days/${dayId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, [field]: value } : d))
  }

  async function saveDayHeader(dayId: string) {
    await fetch(`/api/tours/${tour.id}/days/${dayId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: dayHeaderForm.title, city: dayHeaderForm.city || null }),
    })
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, title: dayHeaderForm.title, city: dayHeaderForm.city || null } : d))
    setEditingDayHeader(null)
  }

  return (
    <div className="space-y-4">
      {days.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-3xl mb-3">📅</p>
          <p className="font-semibold text-gray-900">ยังไม่มีกำหนดการ</p>
          <p className="text-gray-400 text-sm mt-1">เพิ่มวันเดินทางเพื่อเริ่มสร้างกำหนดการ</p>
        </div>
      ) : (
        days.map((day) => (
          <div key={day.id} className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            {/* Day header — click to edit */}
            <div className="p-4 border-b border-gray-100/60 bg-gradient-to-r from-indigo-50/40 to-transparent">
              {editingDayHeader === day.id ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-400 py-1">วันที่ {day.dayNumber} —</span>
                    <input
                      type="text"
                      value={dayHeaderForm.title}
                      onChange={e => setDayHeaderForm(p => ({ ...p, title: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-indigo-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') saveDayHeader(day.id); if (e.key === 'Escape') setEditingDayHeader(null) }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{new Date(day.date).toLocaleDateString('th-TH')} ·</span>
                    <input
                      type="text"
                      value={dayHeaderForm.city}
                      onChange={e => setDayHeaderForm(p => ({ ...p, city: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="เมือง"
                      onKeyDown={e => { if (e.key === 'Enter') saveDayHeader(day.id) }}
                    />
                    <button onClick={() => saveDayHeader(day.id)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium">บันทึก</button>
                    <button onClick={() => setEditingDayHeader(null)} className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600">ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => { setEditingDayHeader(day.id); setDayHeaderForm({ title: day.title, city: day.city ?? '' }) }}
                  className="cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">วันที่ {day.dayNumber}</span>
                    <p className="font-semibold text-gray-900">{day.title}</p>
                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(day.date).toLocaleDateString('th-TH')}
                    {day.city && ` · ${day.city}`}
                  </p>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                {([
                  { key: 'mealBreakfast' as const, label: 'เช้า', emoji: '🍳' },
                  { key: 'mealLunch' as const, label: 'กลางวัน', emoji: '🍱' },
                  { key: 'mealDinner' as const, label: 'เย็น', emoji: '🍽️' },
                ] as const).map((meal) => (
                  <button
                    key={meal.key}
                    onClick={() => updateMeals(day.id, meal.key, !day[meal.key])}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      day[meal.key] ? 'bg-green-100 text-green-700 border border-green-200 shadow-sm' : 'bg-gray-50 text-gray-400 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {meal.emoji} {meal.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div className="p-4">
              {day.activities.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">ยังไม่มีกิจกรรม</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {day.activities.map((act, actIndex) => (
                    <div
                      key={act.id}
                      draggable={editingActivity !== act.id}
                      onDragStart={() => handleDragStart(day.id, actIndex)}
                      onDragOver={(e) => handleDragOver(e, day.id, actIndex)}
                      onDrop={() => handleDrop(day.id)}
                      onDragEnd={() => { setDragItem(null); setDragOverItem(null) }}
                      className={`transition-all ${
                        dragOverItem?.dayId === day.id && dragOverItem?.actIndex === actIndex
                          ? 'border-t-2 border-indigo-400 pt-1'
                          : ''
                      }`}
                    >
                      {editingActivity === act.id ? (
                        <ActivityForm
                          initial={{
                            time: act.time ?? '',
                            title: act.title,
                            titleLocal: act.titleLocal ?? '',
                            description: act.description ?? '',
                            category: act.category,
                            imageUrls: act.imageUrls ?? [],
                            googleMapUrl: (act as Activity & { googleMapUrl?: string }).googleMapUrl ?? '',
                          }}
                          tourId={tour.id}
                          dayId={day.id}
                          activityId={act.id}
                          isChina={tour.isChina}
                          submitLabel="บันทึก"
                          onSave={(updated) => {
                            setDays((prev) => prev.map((d) =>
                              d.id === day.id
                                ? { ...d, activities: d.activities.map((a) => a.id === act.id ? updated : a) }
                                : d
                            ))
                            setEditingActivity(null)
                          }}
                          onCancel={() => setEditingActivity(null)}
                          onDelete={() => {
                            setDays((prev) => prev.map((d) =>
                              d.id === day.id
                                ? { ...d, activities: d.activities.filter((a) => a.id !== act.id) }
                                : d
                            ))
                            setEditingActivity(null)
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingActivity(act.id); setAddingActivity(null) }}
                          className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 bg-white/70 backdrop-blur-sm border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 rounded-xl transition-all text-left group cursor-grab active:cursor-grabbing shadow-sm"
                        >
                          {/* Drag handle — hidden on mobile */}
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 hidden sm:block" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                          </svg>
                          {(() => {
                            const cat = categoryOptions.find((c) => c.value === act.category)
                            return (act.imageUrls ?? []).length > 0 ? (
                              <div className="relative flex-shrink-0">
                                <img src={act.imageUrls[0]} alt="" className="w-12 h-10 rounded-lg object-cover ring-1 ring-gray-200" />
                                {act.imageUrls.length > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                    {act.imageUrls.length}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className={`w-12 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${cat?.color ?? 'bg-gray-100 text-gray-600'}`}>
                                {cat?.emoji ?? '📍'}
                              </div>
                            )
                          })()}
                          {act.time && <span className="text-[11px] sm:text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 sm:px-2 py-0.5 rounded-md w-12 sm:w-14 text-center flex-shrink-0">{act.time}</span>}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{act.title}</p>
                            {act.titleLocal && <p className="text-xs text-gray-500">{act.titleLocal}</p>}
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0">
                            <div className="p-1.5 text-gray-400 group-hover:text-indigo-600 hover:!bg-indigo-50 rounded-lg transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            </div>
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!confirm('ลบกิจกรรมนี้?')) return
                                fetch(`/api/tours/${tour.id}/days/${day.id}/activities/${act.id}`, { method: 'DELETE' })
                                  .then(res => {
                                    if (res.ok) {
                                      setDays(prev => prev.map(d =>
                                        d.id === day.id ? { ...d, activities: d.activities.filter(a => a.id !== act.id) } : d
                                      ))
                                    }
                                  })
                              }}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') (e.target as HTMLElement).click() }}
                              className="p-1.5 text-gray-400 group-hover:text-red-500 hover:!text-red-600 hover:!bg-red-50 rounded-lg transition-colors"
                              title="ลบกิจกรรม"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Accommodation — read-only display, managed via Hotels tab */}
              {day.accommodation && (
                <div className="mt-3 pt-3 border-t border-gray-100/60">
                  <div className="flex items-center gap-3 p-3 bg-violet-50/50 border border-violet-200/50 rounded-xl">
                    {day.accommodation.imageUrl ? (
                      <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-violet-200/50">
                        <img src={day.accommodation.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" /></svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{day.accommodation.name}</p>
                      <div className="flex gap-3 text-[11px] text-violet-600 mt-0.5">
                        {day.accommodation.checkIn && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            เช็คอิน {day.accommodation.checkIn}
                          </span>
                        )}
                        {day.accommodation.wifiName && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
                            {day.accommodation.wifiName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {addingActivity === day.id ? (
                <ActivityForm
                  initial={{ time: '', title: '', titleLocal: '', description: '', category: 'SIGHTSEEING', imageUrls: [], googleMapUrl: '' }}
                  tourId={tour.id}
                  dayId={day.id}
                  isChina={tour.isChina}
                  submitLabel="เพิ่มกิจกรรม"
                  onSave={(activity) => {
                    setDays((prev) => prev.map((d) =>
                      d.id === day.id ? { ...d, activities: [...d.activities, activity] } : d
                    ))
                    setAddingActivity(null)
                  }}
                  onCancel={() => setAddingActivity(null)}
                />
              ) : (
                <button
                  onClick={() => { setAddingActivity(day.id); setEditingActivity(null) }}
                  className="w-full py-2.5 bg-indigo-50/50 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100/50 hover:border-indigo-400 transition-colors"
                >
                  + เพิ่มกิจกรรม
                </button>
              )}
            </div>
          </div>
        ))
      )}

      <button
        onClick={addDay}
        disabled={addingDay}
        className="w-full py-3 bg-emerald-50/50 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-2xl text-sm font-medium hover:bg-emerald-100/50 hover:border-emerald-400 transition-colors disabled:opacity-50"
      >
        {addingDay ? 'กำลังเพิ่ม...' : `+ เพิ่มวันที่ ${days.length + 1}`}
      </button>
    </div>
  )
}
