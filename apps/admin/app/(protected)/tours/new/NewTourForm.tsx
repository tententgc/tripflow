'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const countries = [
  { iso2: 'CN', nameTh: 'จีน', emoji: '🇨🇳' },
  { iso2: 'JP', nameTh: 'ญี่ปุ่น', emoji: '🇯🇵' },
  { iso2: 'KR', nameTh: 'เกาหลีใต้', emoji: '🇰🇷' },
  { iso2: 'FR', nameTh: 'ฝรั่งเศส', emoji: '🇫🇷' },
  { iso2: 'IT', nameTh: 'อิตาลี', emoji: '🇮🇹' },
  { iso2: 'GB', nameTh: 'อังกฤษ', emoji: '🇬🇧' },
  { iso2: 'SG', nameTh: 'สิงคโปร์', emoji: '🇸🇬' },
  { iso2: 'MY', nameTh: 'มาเลเซีย', emoji: '🇲🇾' },
  { iso2: 'TW', nameTh: 'ไต้หวัน', emoji: '🇹🇼' },
  { iso2: 'AU', nameTh: 'ออสเตรเลีย', emoji: '🇦🇺' },
  { iso2: 'DE', nameTh: 'เยอรมนี', emoji: '🇩🇪' },
  { iso2: 'CH', nameTh: 'สวิตเซอร์แลนด์', emoji: '🇨🇭' },
  { iso2: 'VN', nameTh: 'เวียดนาม', emoji: '🇻🇳' },
  { iso2: 'HK', nameTh: 'ฮ่องกง', emoji: '🇭🇰' },
  { iso2: 'US', nameTh: 'อเมริกา', emoji: '🇺🇸' },
]

const timezones: Record<string, string> = {
  CN: 'Asia/Shanghai', JP: 'Asia/Tokyo', KR: 'Asia/Seoul',
  FR: 'Europe/Paris', IT: 'Europe/Rome', GB: 'Europe/London',
  SG: 'Asia/Singapore', MY: 'Asia/Kuala_Lumpur', TW: 'Asia/Taipei',
  AU: 'Australia/Sydney', DE: 'Europe/Berlin', CH: 'Europe/Zurich',
  VN: 'Asia/Ho_Chi_Minh', HK: 'Asia/Hong_Kong', US: 'America/New_York',
}

export default function NewTourForm({ operatorId }: { operatorId: string }) {
  const router = useRouter()
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isChina = selectedCountries.includes('CN')

  function toggleCountry(iso2: string) {
    setSelectedCountries((prev) =>
      prev.includes(iso2) ? prev.filter((c) => c !== iso2) : [...prev, iso2]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const fd = new FormData(form)

    const title = fd.get('title') as string
    const titleEn = fd.get('titleEn') as string
    const startDate = fd.get('startDate') as string
    const endDate = fd.get('endDate') as string
    const maxMembers = fd.get('maxMembers') as string
    const tourCode = fd.get('tourCode') as string
    const citiesRaw = fd.get('cities') as string

    if (!title || !startDate || !endDate || selectedCountries.length === 0) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
      return
    }

    const cities = citiesRaw ? citiesRaw.split(',').map((c) => c.trim()).filter(Boolean) : []
    const timezone = (selectedCountries[0] ? timezones[selectedCountries[0]] : undefined) ?? 'Asia/Bangkok'

    setLoading(true)
    try {
      const res = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId,
          title,
          titleEn: titleEn || undefined,
          countries: selectedCountries,
          cities,
          startDate,
          endDate,
          timezone,
          maxMembers: maxMembers ? parseInt(maxMembers) : undefined,
          tourCode: tourCode || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'เกิดข้อผิดพลาด')
        return
      }
      const tour = await res.json()
      router.push(`/tours/${tour.id}`)
    } catch {
      setError('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ชื่อทัวร์ (ภาษาไทย) <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ทัวร์จีน ปักกิ่ง-กำแพงเมืองจีน 6 วัน"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อทัวร์ (English)</label>
        <input
          name="titleEn"
          type="text"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Beijing Great Wall China Tour 6 Days"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ประเทศปลายทาง <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
          {countries.map((country) => (
            <button
              key={country.iso2}
              type="button"
              onClick={() => toggleCountry(country.iso2)}
              className={`flex flex-col items-center gap-1 px-3 py-3 border rounded-xl transition-colors text-sm ${
                selectedCountries.includes(country.iso2)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <span className="text-2xl">{country.emoji}</span>
              <span className="text-xs">{country.nameTh}</span>
            </button>
          ))}
        </div>
        {isChina && (
          <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
            🇨🇳 China Mode เปิดใช้งานอัตโนมัติ — ใช้ Amap, Qwen AI, JPush แทน Google/Claude/Firebase
          </div>
        )}
        {selectedCountries.length === 0 && (
          <p className="text-xs text-orange-600 mt-2">⚠️ กรุณาเลือกอย่างน้อย 1 ประเทศ</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">เมืองที่ไปเที่ยว (คั่นด้วยจุลภาค)</label>
        <input
          name="cities"
          type="text"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={isChina ? 'ปักกิ่ง, เซี่ยงไฮ้' : 'โตเกียว, โอซาก้า'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            วันออกเดินทาง <span className="text-red-500">*</span>
          </label>
          <input
            name="startDate"
            type="date"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            วันกลับ <span className="text-red-500">*</span>
          </label>
          <input
            name="endDate"
            type="date"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนสมาชิกสูงสุด</label>
          <input
            name="maxMembers"
            type="number"
            min="1"
            max="200"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รหัสทัวร์ (Tour Code)</label>
          <input
            name="tourCode"
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={isChina ? 'CN2026-04' : 'JP2026-05'}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <a
          href="/tours"
          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          ยกเลิก
        </a>
        <button
          type="submit"
          disabled={loading || selectedCountries.length === 0}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'กำลังสร้าง...' : 'สร้างทัวร์ →'}
        </button>
      </div>
    </form>
  )
}
