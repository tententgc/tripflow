'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function ItineraryBuilder({ tour }: { tour: Tour }) {
  const router = useRouter()
  const [days, setDays] = useState<Day[]>(tour.days)
  const [addingActivity, setAddingActivity] = useState<string | null>(null) // dayId
  const [newActivity, setNewActivity] = useState({ time: '', title: '', titleLocal: '', category: 'SIGHTSEEING', imageUrl: '' })
  const [imageUploading, setImageUploading] = useState(false)
  const [saving, setSaving] = useState(false)
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

  async function uploadImage(file: File): Promise<string | null> {
    setImageUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) return null
      const { url } = await res.json() as { url: string }
      return url
    } finally {
      setImageUploading(false)
    }
  }

  async function addActivity(dayId: string) {
    if (!newActivity.title) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tours/${tour.id}/days/${dayId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: newActivity.time || null,
          title: newActivity.title,
          titleLocal: newActivity.titleLocal || null,
          category: newActivity.category,
          imageUrl: newActivity.imageUrl || null,
        }),
      })
      if (res.ok) {
        const activity = await res.json()
        setDays((prev) => prev.map((d) =>
          d.id === dayId
            ? { ...d, activities: [...d.activities, activity] }
            : d
        ))
        setNewActivity({ time: '', title: '', titleLocal: '', category: 'SIGHTSEEING', imageUrl: '' })
        setAddingActivity(null)
      }
    } finally {
      setSaving(false)
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
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">วันที่ {day.dayNumber} — {day.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(day.date).toLocaleDateString('th-TH')}
                    {day.city && ` · ${day.city}`}
                  </p>
                </div>
              </div>

              {/* Meal toggles */}
              <div className="flex gap-2 mt-2">
                {[
                  { key: 'mealBreakfast' as const, label: 'เช้า', emoji: '🍳' },
                  { key: 'mealLunch' as const, label: 'กลางวัน', emoji: '🍱' },
                  { key: 'mealDinner' as const, label: 'เย็น', emoji: '🍽️' },
                ].map((meal) => (
                  <button
                    key={meal.key}
                    onClick={() => updateMeals(day.id, meal.key, !day[meal.key])}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      day[meal.key]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
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
                    <div key={act.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
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
                    </div>
                  ))}
                </div>
              )}

              {addingActivity === day.id ? (
                <div className="bg-blue-50 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="time"
                      value={newActivity.time}
                      onChange={(e) => setNewActivity((p) => ({ ...p, time: e.target.value }))}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="เวลา"
                    />
                    <input
                      type="text"
                      value={newActivity.title}
                      onChange={(e) => setNewActivity((p) => ({ ...p, title: e.target.value }))}
                      className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="ชื่อกิจกรรม (ภาษาไทย) *"
                      autoFocus
                    />
                  </div>
                  <input
                    type="text"
                    value={newActivity.titleLocal}
                    onChange={(e) => setNewActivity((p) => ({ ...p, titleLocal: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={tour.isChina ? 'ชื่อภาษาจีน (故宫博物院)' : 'ชื่อภาษาท้องถิ่น (英語名)'}
                  />
                  <select
                    value={newActivity.category}
                    onChange={(e) => setNewActivity((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
                    ))}
                  </select>

                  {/* Image upload */}
                  <div className="flex items-center gap-3">
                    {newActivity.imageUrl ? (
                      <div className="relative flex-shrink-0">
                        <img src={newActivity.imageUrl} alt="" className="w-16 h-14 rounded-lg object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewActivity((p) => ({ ...p, imageUrl: '' }))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                        >✕</button>
                      </div>
                    ) : null}
                    <label className={`flex-1 flex items-center justify-center gap-2 py-2 border border-dashed rounded-lg text-xs cursor-pointer transition-colors ${imageUploading ? 'opacity-50 cursor-wait' : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'}`}>
                      <span>🖼️</span>
                      <span>{imageUploading ? 'กำลังอัพโหลด...' : newActivity.imageUrl ? 'เปลี่ยนรูป' : 'เพิ่มรูปสถานที่ (ไม่บังคับ)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={imageUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const url = await uploadImage(file)
                          if (url) setNewActivity((p) => ({ ...p, imageUrl: url }))
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => addActivity(day.id)}
                      disabled={saving || !newActivity.title}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? 'กำลังบันทึก...' : 'เพิ่มกิจกรรม'}
                    </button>
                    <button
                      onClick={() => setAddingActivity(null)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingActivity(day.id)}
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
