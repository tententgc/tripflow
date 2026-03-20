'use client'

import { useState } from 'react'

interface Activity {
  id: string
  time: string | null
  title: string
  titleLocal: string | null
  category: string
  order: number
  imageUrl: string | null
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
    name: string
    wifiName: string | null
    wifiPassword: string | null
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
  category: string
  imageUrl: string
}

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
  activityId?: string   // present = edit mode
  isChina: boolean
  onSave: (activity: Activity) => void
  onCancel: () => void
  onDelete?: () => void
  submitLabel: string
}) {
  const [form, setForm] = useState<EditState>(initial)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function uploadImage(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) return
      const { url } = await res.json() as { url: string }
      setForm((p) => ({ ...p, imageUrl: url }))
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const url = activityId
        ? `/api/tours/${tourId}/days/${dayId}/activities/${activityId}`
        : `/api/tours/${tourId}/days/${dayId}/activities`
      const method = activityId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: form.time || null,
          title: form.title.trim(),
          titleLocal: form.titleLocal.trim() || null,
          category: form.category,
          imageUrl: form.imageUrl || null,
        }),
      })
      if (res.ok) {
        const activity = await res.json() as Activity
        onSave(activity)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteActivity() {
    if (!activityId) return
    if (!confirm('ลบกิจกรรมนี้?')) return
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
      <select
        value={form.category}
        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {categoryOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
        ))}
      </select>

      {/* Image upload */}
      <div className="flex items-center gap-3">
        {form.imageUrl && (
          <div className="relative flex-shrink-0">
            <img src={form.imageUrl} alt="" className="w-16 h-14 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
            >✕</button>
          </div>
        )}
        <label className={`flex-1 flex items-center justify-center gap-2 py-2 border border-dashed rounded-lg text-xs cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-wait' : 'border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600'}`}>
          <span>🖼️</span>
          <span>{uploading ? 'กำลังอัพโหลด...' : form.imageUrl ? 'เปลี่ยนรูป' : 'เพิ่มรูปสถานที่ (ไม่บังคับ)'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f) }}
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving || uploading || !form.title.trim()}
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
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  )
}

export default function ItineraryBuilder({ tour }: { tour: Tour }) {
  const [days, setDays] = useState<Day[]>(tour.days)
  const [addingActivity, setAddingActivity] = useState<string | null>(null) // dayId
  const [editingActivity, setEditingActivity] = useState<string | null>(null) // activityId
  const [addingDay, setAddingDay] = useState(false)

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
          <p className="text-gray-400 text-sm mt-1 mb-4">เพิ่มวันเดินทางเพื่อเริ่มสร้างกำหนดการ</p>
        </div>
      ) : (
        days.map((day) => (
          <div key={day.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Day header */}
            <div className="p-4 border-b border-gray-100">
              <div className="mb-2">
                <p className="font-semibold text-gray-900">วันที่ {day.dayNumber} — {day.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(day.date).toLocaleDateString('th-TH')}
                  {day.city && ` · ${day.city}`}
                </p>
              </div>
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
                  {day.activities.map((act) => (
                    <div key={act.id}>
                      {editingActivity === act.id ? (
                        <ActivityForm
                          initial={{
                            time: act.time ?? '',
                            title: act.title,
                            titleLocal: act.titleLocal ?? '',
                            category: act.category,
                            imageUrl: act.imageUrl ?? '',
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
                          className="w-full flex items-center gap-3 p-2 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors text-left group"
                        >
                          {act.imageUrl ? (
                            <img src={act.imageUrl} alt="" className="w-12 h-10 rounded-lg object-cover flex-shrink-0" />
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
                          <span className="text-xs text-gray-300 group-hover:text-blue-400 flex-shrink-0">✏️</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {addingActivity === day.id ? (
                <ActivityForm
                  initial={{ time: '', title: '', titleLocal: '', category: 'SIGHTSEEING', imageUrl: '' }}
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
