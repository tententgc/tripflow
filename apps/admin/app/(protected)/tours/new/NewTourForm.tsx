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

const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 bg-gray-50/50 transition-colors'

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
          operatorId, title, titleEn: titleEn || undefined,
          countries: selectedCountries, cities, startDate, endDate, timezone,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Section 1: Tour Name */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm">📝</div>
          <h2 className="text-sm font-bold text-gray-900">ข้อมูลทัวร์</h2>
        </div>

        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">
            ชื่อทัวร์ (ไทย) <span className="text-red-400">*</span>
          </label>
          <input name="title" type="text" required className={inputCls}
            placeholder="ทัวร์จีน ปักกิ่ง-กำแพงเมืองจีน 6 วัน" />
        </div>

        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">ชื่อทัวร์ (EN)</label>
          <input name="titleEn" type="text" className={inputCls}
            placeholder="Beijing Great Wall China Tour 6 Days" />
        </div>
      </div>

      {/* Section 2: Destinations */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm">🌍</div>
          <h2 className="text-sm font-bold text-gray-900">ประเทศปลายทาง <span className="text-red-400">*</span></h2>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {countries.map((country) => (
            <button
              key={country.iso2}
              type="button"
              onClick={() => toggleCountry(country.iso2)}
              className={`flex flex-col items-center gap-1.5 px-2 py-3 border-2 rounded-xl transition-all duration-200 text-sm ${
                selectedCountries.includes(country.iso2)
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm scale-105'
                  : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50'
              }`}
            >
              <span className="text-2xl">{country.emoji}</span>
              <span className="text-[11px] font-medium">{country.nameTh}</span>
            </button>
          ))}
        </div>

        {isChina && (
          <div className="mt-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-start gap-2">
            <span className="text-base mt-0.5">🇨🇳</span>
            <div>
              <p className="font-bold">China Mode เปิดอัตโนมัติ</p>
              <p className="text-red-500 mt-0.5">ใช้ Amap, Qwen AI, JPush, Caiyun Weather แทนบริการ Google/Firebase/Anthropic</p>
            </div>
          </div>
        )}

        {selectedCountries.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-400">เลือกแล้ว:</span>
            <div className="flex gap-1">
              {selectedCountries.map(c => {
                const country = countries.find(cc => cc.iso2 === c)
                return (
                  <span key={c} className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    {country?.emoji} {country?.nameTh}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">เมืองที่ไปเที่ยว</label>
          <input name="cities" type="text" className={inputCls}
            placeholder={isChina ? 'ปักกิ่ง, เซี่ยงไฮ้' : 'โตเกียว, โอซาก้า'} />
        </div>
      </div>

      {/* Section 3: Dates */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm">📅</div>
          <h2 className="text-sm font-bold text-gray-900">วันเดินทาง</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">
              วันออกเดินทาง <span className="text-red-400">*</span>
            </label>
            <input name="startDate" type="date" required className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">
              วันกลับ <span className="text-red-400">*</span>
            </label>
            <input name="endDate" type="date" required className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">จำนวนสมาชิกสูงสุด</label>
            <input name="maxMembers" type="number" min="1" max="200" className={inputCls} placeholder="30" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">รหัสทัวร์ (Tour Code)</label>
            <input name="tourCode" type="text" className={inputCls} placeholder={isChina ? 'CN2026-04' : 'JP2026-05'} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <a href="/tours"
          className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm">
          ยกเลิก
        </a>
        <button
          type="submit"
          disabled={loading || selectedCountries.length === 0}
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'กำลังสร้าง...' : '✨ สร้างทัวร์'}
        </button>
      </div>
    </form>
  )
}
