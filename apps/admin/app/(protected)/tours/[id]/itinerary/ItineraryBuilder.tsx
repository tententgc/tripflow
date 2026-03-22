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
  { value: 'SIGHTSEEING', label: 'สถานที่ท่องเที่ยว', emoji: '🏛️' },
  { value: 'FOOD', label: 'อาหาร', emoji: '🍜' },
  { value: 'TRANSPORT', label: 'การเดินทาง', emoji: '🚌' },
  { value: 'ACCOMMODATION', label: 'ที่พัก', emoji: '🏨' },
  { value: 'SHOPPING', label: 'ช้อปปิ้ง', emoji: '🛍️' },
  { value: 'TEMPLE', label: 'วัด/ศาสนสถาน', emoji: '⛩️' },
  { value: 'NATURE', label: 'ธรรมชาติ', emoji: '🌿' },
  { value: 'OTHER', label: 'อื่นๆ', emoji: '📍' },
]

type EditState = {
  time: string
  title: string
  titleLocal: string
  description: string
  category: string
  imageUrls: string[]
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
          >🗑️</button>
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
  const [editingAccom, setEditingAccom] = useState<string | null>(null)
  const [accomForm, setAccomForm] = useState({
    name: '', nameLocal: '', address: '', phone: '',
    checkIn: '', checkOut: '', confirmationNo: '',
    wifiName: '', wifiPassword: '', roomType: '', imageUrl: '', notes: '',
  })
  const [savingAccom, setSavingAccom] = useState(false)
  const [uploadingAccomImg, setUploadingAccomImg] = useState(false)
  const accomImgRef = useRef<HTMLInputElement>(null)

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

  async function uploadAccomImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAccomImg(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setAccomForm(p => ({ ...p, imageUrl: data.url }))
      }
    } finally {
      setUploadingAccomImg(false)
    }
  }

  function startEditAccom(day: Day) {
    setEditingAccom(day.id)
    const a = day.accommodation
    setAccomForm({
      name: a?.name ?? '', nameLocal: a?.nameLocal ?? '', address: a?.address ?? '',
      phone: a?.phone ?? '', checkIn: a?.checkIn ?? '', checkOut: a?.checkOut ?? '',
      confirmationNo: a?.confirmationNo ?? '', wifiName: a?.wifiName ?? '',
      wifiPassword: a?.wifiPassword ?? '', roomType: a?.roomType ?? '',
      imageUrl: a?.imageUrl ?? '', notes: a?.notes ?? '',
    })
  }

  async function saveAccom(dayId: string) {
    if (!accomForm.name.trim()) return
    setSavingAccom(true)
    try {
      const res = await fetch(`/api/tours/${tour.id}/days/${dayId}/accommodation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accomForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setDays(prev => prev.map(d => d.id === dayId ? { ...d, accommodation: updated } : d))
        setEditingAccom(null)
      }
    } finally {
      setSavingAccom(false)
    }
  }

  async function deleteAccom(dayId: string) {
    if (!confirm('ลบที่พักของวันนี้?')) return
    const res = await fetch(`/api/tours/${tour.id}/days/${dayId}/accommodation`, { method: 'DELETE' })
    if (res.ok) {
      setDays(prev => prev.map(d => d.id === dayId ? { ...d, accommodation: null } : d))
      setEditingAccom(null)
    }
  }

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
          <div key={day.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Day header */}
            <div className="p-4 border-b border-gray-100">
              <p className="font-semibold text-gray-900">วันที่ {day.dayNumber} — {day.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(day.date).toLocaleDateString('th-TH')}
                {day.city && ` · ${day.city}`}
              </p>
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
                      day[meal.key] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
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
                          className="w-full flex items-center gap-3 p-2 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors text-left group cursor-grab active:cursor-grabbing"
                        >
                          {/* Drag handle */}
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                          </svg>
                          {(act.imageUrls ?? []).length > 0 ? (
                            <div className="relative flex-shrink-0">
                              <img src={act.imageUrls[0]} alt="" className="w-12 h-10 rounded-lg object-cover" />
                              {act.imageUrls.length > 1 && (
                                <span className="absolute -bottom-1 -right-1 bg-gray-800 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                  {act.imageUrls.length}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-12 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 text-lg">
                              {categoryOptions.find((c) => c.value === act.category)?.emoji ?? '📍'}
                            </div>
                          )}
                          {act.time && <span className="text-xs text-gray-500 w-12 flex-shrink-0">{act.time}</span>}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{act.title}</p>
                            {act.titleLocal && <p className="text-xs text-gray-400">{act.titleLocal}</p>}
                          </div>
                          <span className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 text-sm">✏️</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Accommodation */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                {editingAccom === day.id ? (
                  <div className="bg-violet-50 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-violet-700">🏨 ที่พัก</p>

                    {/* Image: upload or paste URL */}
                    <input ref={accomImgRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={uploadAccomImage} className="hidden" />
                    {accomForm.imageUrl ? (
                      <div className="relative w-full h-28 rounded-xl overflow-hidden border border-violet-200">
                        <img src={accomForm.imageUrl} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAccomForm(p => ({ ...p, imageUrl: '' }))}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70"
                        >✕</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => accomImgRef.current?.click()}
                        disabled={uploadingAccomImg}
                        className="w-full h-20 border border-dashed border-violet-300 rounded-xl flex items-center justify-center hover:border-violet-400 transition-colors bg-white"
                      >
                        {uploadingAccomImg ? (
                          <span className="text-xs text-violet-400">กำลังอัพโหลด...</span>
                        ) : (
                          <div className="text-center">
                            <span className="text-xl">📷</span>
                            <p className="text-[10px] text-violet-400 mt-0.5">อัพโหลดรูปที่พัก</p>
                          </div>
                        )}
                      </button>
                    )}
                    <input
                      type="text"
                      value={accomForm.imageUrl}
                      onChange={e => setAccomForm(p => ({ ...p, imageUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                      placeholder="หรือวาง URL รูปภาพ (https://...)"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={accomForm.name} onChange={e => setAccomForm(p => ({ ...p, name: e.target.value }))}
                        className="col-span-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="ชื่อโรงแรม *" autoFocus />
                      <input type="text" value={accomForm.nameLocal} onChange={e => setAccomForm(p => ({ ...p, nameLocal: e.target.value }))}
                        className="col-span-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="ชื่อภาษาท้องถิ่น" />
                      <input type="text" value={accomForm.address} onChange={e => setAccomForm(p => ({ ...p, address: e.target.value }))}
                        className="col-span-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="ที่อยู่" />
                      <input type="text" value={accomForm.phone} onChange={e => setAccomForm(p => ({ ...p, phone: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="เบอร์โทร" />
                      <input type="text" value={accomForm.roomType} onChange={e => setAccomForm(p => ({ ...p, roomType: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="ประเภทห้อง" />
                      <input type="text" value={accomForm.checkIn} onChange={e => setAccomForm(p => ({ ...p, checkIn: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="เช็คอิน (14:00)" />
                      <input type="text" value={accomForm.checkOut} onChange={e => setAccomForm(p => ({ ...p, checkOut: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="เช็คเอาต์ (12:00)" />
                      <input type="text" value={accomForm.confirmationNo} onChange={e => setAccomForm(p => ({ ...p, confirmationNo: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="Confirmation No." />
                      <input type="text" value={accomForm.wifiName} onChange={e => setAccomForm(p => ({ ...p, wifiName: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="WiFi ชื่อ" />
                      <input type="text" value={accomForm.wifiPassword} onChange={e => setAccomForm(p => ({ ...p, wifiPassword: e.target.value }))}
                        className="col-span-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="WiFi รหัส" />
                      <input type="text" value={accomForm.notes} onChange={e => setAccomForm(p => ({ ...p, notes: e.target.value }))}
                        className="col-span-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="หมายเหตุ" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => saveAccom(day.id)} disabled={savingAccom || !accomForm.name.trim()}
                        className="flex-1 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                        {savingAccom ? 'กำลังบันทึก...' : 'บันทึกที่พัก'}
                      </button>
                      <button onClick={() => setEditingAccom(null)}
                        className="px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-lg text-sm">ยกเลิก</button>
                      {day.accommodation && (
                        <button onClick={() => deleteAccom(day.id)}
                          className="px-3 py-2 text-red-400 hover:text-red-600 rounded-lg text-sm">🗑️</button>
                      )}
                    </div>
                  </div>
                ) : day.accommodation ? (
                  <button
                    onClick={() => startEditAccom(day)}
                    className="w-full flex items-center gap-3 p-2.5 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors text-left group"
                  >
                    {day.accommodation.imageUrl ? (
                      <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={day.accommodation.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-violet-200 flex items-center justify-center flex-shrink-0 text-lg">🏨</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{day.accommodation.name}</p>
                      <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5">
                        {day.accommodation.checkIn && <span>เช็คอิน {day.accommodation.checkIn}</span>}
                        {day.accommodation.confirmationNo && <span>#{day.accommodation.confirmationNo}</span>}
                        {day.accommodation.wifiName && <span>📶 {day.accommodation.wifiName}</span>}
                      </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-violet-400 flex-shrink-0 text-sm">✏️</span>
                  </button>
                ) : (
                  <button
                    onClick={() => startEditAccom(day)}
                    className="w-full py-2 border border-dashed border-violet-300 text-violet-500 rounded-xl text-xs hover:bg-violet-50 transition-colors"
                  >
                    + เพิ่มที่พัก
                  </button>
                )}
              </div>

              {addingActivity === day.id ? (
                <ActivityForm
                  initial={{ time: '', title: '', titleLocal: '', description: '', category: 'SIGHTSEEING', imageUrls: [] }}
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
                  className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-xl text-sm hover:border-blue-400 hover:text-blue-600 transition-colors"
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
        className="w-full py-3 border border-dashed border-blue-300 text-blue-600 rounded-2xl text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
      >
        {addingDay ? 'กำลังเพิ่ม...' : `+ เพิ่มวันที่ ${days.length + 1}`}
      </button>
    </div>
  )
}
