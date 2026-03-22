'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Popular countries shown as quick-select buttons
const popularCountries = [
  { iso2: 'CN', nameTh: 'จีน', emoji: '🇨🇳' },
  { iso2: 'JP', nameTh: 'ญี่ปุ่น', emoji: '🇯🇵' },
  { iso2: 'KR', nameTh: 'เกาหลีใต้', emoji: '🇰🇷' },
  { iso2: 'VN', nameTh: 'เวียดนาม', emoji: '🇻🇳' },
  { iso2: 'SG', nameTh: 'สิงคโปร์', emoji: '🇸🇬' },
  { iso2: 'MY', nameTh: 'มาเลเซีย', emoji: '🇲🇾' },
  { iso2: 'TW', nameTh: 'ไต้หวัน', emoji: '🇹🇼' },
  { iso2: 'HK', nameTh: 'ฮ่องกง', emoji: '🇭🇰' },
  { iso2: 'FR', nameTh: 'ฝรั่งเศส', emoji: '🇫🇷' },
  { iso2: 'IT', nameTh: 'อิตาลี', emoji: '🇮🇹' },
]

// Full world countries list
const allCountries = [
  // เอเชียตะวันออก
  { iso2: 'CN', nameTh: 'จีน', nameEn: 'China', emoji: '🇨🇳' },
  { iso2: 'JP', nameTh: 'ญี่ปุ่น', nameEn: 'Japan', emoji: '🇯🇵' },
  { iso2: 'KR', nameTh: 'เกาหลีใต้', nameEn: 'South Korea', emoji: '🇰🇷' },
  { iso2: 'TW', nameTh: 'ไต้หวัน', nameEn: 'Taiwan', emoji: '🇹🇼' },
  { iso2: 'HK', nameTh: 'ฮ่องกง', nameEn: 'Hong Kong', emoji: '🇭🇰' },
  { iso2: 'MO', nameTh: 'มาเก๊า', nameEn: 'Macau', emoji: '🇲🇴' },
  { iso2: 'MN', nameTh: 'มองโกเลีย', nameEn: 'Mongolia', emoji: '🇲🇳' },
  // เอเชียตะวันออกเฉียงใต้
  { iso2: 'VN', nameTh: 'เวียดนาม', nameEn: 'Vietnam', emoji: '🇻🇳' },
  { iso2: 'SG', nameTh: 'สิงคโปร์', nameEn: 'Singapore', emoji: '🇸🇬' },
  { iso2: 'MY', nameTh: 'มาเลเซีย', nameEn: 'Malaysia', emoji: '🇲🇾' },
  { iso2: 'ID', nameTh: 'อินโดนีเซีย', nameEn: 'Indonesia', emoji: '🇮🇩' },
  { iso2: 'PH', nameTh: 'ฟิลิปปินส์', nameEn: 'Philippines', emoji: '🇵🇭' },
  { iso2: 'MM', nameTh: 'เมียนมา', nameEn: 'Myanmar', emoji: '🇲🇲' },
  { iso2: 'LA', nameTh: 'ลาว', nameEn: 'Laos', emoji: '🇱🇦' },
  { iso2: 'KH', nameTh: 'กัมพูชา', nameEn: 'Cambodia', emoji: '🇰🇭' },
  { iso2: 'BN', nameTh: 'บรูไน', nameEn: 'Brunei', emoji: '🇧🇳' },
  // เอเชียใต้
  { iso2: 'IN', nameTh: 'อินเดีย', nameEn: 'India', emoji: '🇮🇳' },
  { iso2: 'NP', nameTh: 'เนปาล', nameEn: 'Nepal', emoji: '🇳🇵' },
  { iso2: 'LK', nameTh: 'ศรีลังกา', nameEn: 'Sri Lanka', emoji: '🇱🇰' },
  { iso2: 'BD', nameTh: 'บังคลาเทศ', nameEn: 'Bangladesh', emoji: '🇧🇩' },
  { iso2: 'MV', nameTh: 'มัลดีฟส์', nameEn: 'Maldives', emoji: '🇲🇻' },
  { iso2: 'BT', nameTh: 'ภูฏาน', nameEn: 'Bhutan', emoji: '🇧🇹' },
  { iso2: 'PK', nameTh: 'ปากีสถาน', nameEn: 'Pakistan', emoji: '🇵🇰' },
  // ตะวันออกกลาง
  { iso2: 'AE', nameTh: 'สหรัฐอาหรับเอมิเรตส์', nameEn: 'UAE', emoji: '🇦🇪' },
  { iso2: 'SA', nameTh: 'ซาอุดีอาระเบีย', nameEn: 'Saudi Arabia', emoji: '🇸🇦' },
  { iso2: 'QA', nameTh: 'กาตาร์', nameEn: 'Qatar', emoji: '🇶🇦' },
  { iso2: 'OM', nameTh: 'โอมาน', nameEn: 'Oman', emoji: '🇴🇲' },
  { iso2: 'JO', nameTh: 'จอร์แดน', nameEn: 'Jordan', emoji: '🇯🇴' },
  { iso2: 'IL', nameTh: 'อิสราเอล', nameEn: 'Israel', emoji: '🇮🇱' },
  { iso2: 'TR', nameTh: 'ตุรกี', nameEn: 'Turkey', emoji: '🇹🇷' },
  { iso2: 'GE', nameTh: 'จอร์เจีย', nameEn: 'Georgia', emoji: '🇬🇪' },
  // ยุโรปตะวันตก
  { iso2: 'FR', nameTh: 'ฝรั่งเศส', nameEn: 'France', emoji: '🇫🇷' },
  { iso2: 'IT', nameTh: 'อิตาลี', nameEn: 'Italy', emoji: '🇮🇹' },
  { iso2: 'GB', nameTh: 'อังกฤษ', nameEn: 'United Kingdom', emoji: '🇬🇧' },
  { iso2: 'DE', nameTh: 'เยอรมนี', nameEn: 'Germany', emoji: '🇩🇪' },
  { iso2: 'ES', nameTh: 'สเปน', nameEn: 'Spain', emoji: '🇪🇸' },
  { iso2: 'PT', nameTh: 'โปรตุเกส', nameEn: 'Portugal', emoji: '🇵🇹' },
  { iso2: 'NL', nameTh: 'เนเธอร์แลนด์', nameEn: 'Netherlands', emoji: '🇳🇱' },
  { iso2: 'BE', nameTh: 'เบลเยียม', nameEn: 'Belgium', emoji: '🇧🇪' },
  { iso2: 'CH', nameTh: 'สวิตเซอร์แลนด์', nameEn: 'Switzerland', emoji: '🇨🇭' },
  { iso2: 'AT', nameTh: 'ออสเตรีย', nameEn: 'Austria', emoji: '🇦🇹' },
  { iso2: 'IE', nameTh: 'ไอร์แลนด์', nameEn: 'Ireland', emoji: '🇮🇪' },
  { iso2: 'LU', nameTh: 'ลักเซมเบิร์ก', nameEn: 'Luxembourg', emoji: '🇱🇺' },
  { iso2: 'MC', nameTh: 'โมนาโก', nameEn: 'Monaco', emoji: '🇲🇨' },
  // ยุโรปเหนือ
  { iso2: 'SE', nameTh: 'สวีเดน', nameEn: 'Sweden', emoji: '🇸🇪' },
  { iso2: 'NO', nameTh: 'นอร์เวย์', nameEn: 'Norway', emoji: '🇳🇴' },
  { iso2: 'DK', nameTh: 'เดนมาร์ก', nameEn: 'Denmark', emoji: '🇩🇰' },
  { iso2: 'FI', nameTh: 'ฟินแลนด์', nameEn: 'Finland', emoji: '🇫🇮' },
  { iso2: 'IS', nameTh: 'ไอซ์แลนด์', nameEn: 'Iceland', emoji: '🇮🇸' },
  // ยุโรปตะวันออก
  { iso2: 'CZ', nameTh: 'เช็ก', nameEn: 'Czech Republic', emoji: '🇨🇿' },
  { iso2: 'PL', nameTh: 'โปแลนด์', nameEn: 'Poland', emoji: '🇵🇱' },
  { iso2: 'HU', nameTh: 'ฮังการี', nameEn: 'Hungary', emoji: '🇭🇺' },
  { iso2: 'HR', nameTh: 'โครเอเชีย', nameEn: 'Croatia', emoji: '🇭🇷' },
  { iso2: 'GR', nameTh: 'กรีซ', nameEn: 'Greece', emoji: '🇬🇷' },
  { iso2: 'RU', nameTh: 'รัสเซีย', nameEn: 'Russia', emoji: '🇷🇺' },
  // อเมริกา
  { iso2: 'US', nameTh: 'อเมริกา', nameEn: 'United States', emoji: '🇺🇸' },
  { iso2: 'CA', nameTh: 'แคนาดา', nameEn: 'Canada', emoji: '🇨🇦' },
  { iso2: 'MX', nameTh: 'เม็กซิโก', nameEn: 'Mexico', emoji: '🇲🇽' },
  { iso2: 'BR', nameTh: 'บราซิล', nameEn: 'Brazil', emoji: '🇧🇷' },
  { iso2: 'AR', nameTh: 'อาร์เจนตินา', nameEn: 'Argentina', emoji: '🇦🇷' },
  { iso2: 'PE', nameTh: 'เปรู', nameEn: 'Peru', emoji: '🇵🇪' },
  { iso2: 'CL', nameTh: 'ชิลี', nameEn: 'Chile', emoji: '🇨🇱' },
  { iso2: 'CU', nameTh: 'คิวบา', nameEn: 'Cuba', emoji: '🇨🇺' },
  // โอเชียเนีย
  { iso2: 'AU', nameTh: 'ออสเตรเลีย', nameEn: 'Australia', emoji: '🇦🇺' },
  { iso2: 'NZ', nameTh: 'นิวซีแลนด์', nameEn: 'New Zealand', emoji: '🇳🇿' },
  { iso2: 'FJ', nameTh: 'ฟิจิ', nameEn: 'Fiji', emoji: '🇫🇯' },
  // แอฟริกา
  { iso2: 'EG', nameTh: 'อียิปต์', nameEn: 'Egypt', emoji: '🇪🇬' },
  { iso2: 'MA', nameTh: 'โมร็อกโก', nameEn: 'Morocco', emoji: '🇲🇦' },
  { iso2: 'ZA', nameTh: 'แอฟริกาใต้', nameEn: 'South Africa', emoji: '🇿🇦' },
  { iso2: 'KE', nameTh: 'เคนยา', nameEn: 'Kenya', emoji: '🇰🇪' },
  { iso2: 'TZ', nameTh: 'แทนซาเนีย', nameEn: 'Tanzania', emoji: '🇹🇿' },
]

const timezones: Record<string, string> = {
  CN: 'Asia/Shanghai', JP: 'Asia/Tokyo', KR: 'Asia/Seoul',
  TW: 'Asia/Taipei', HK: 'Asia/Hong_Kong', MO: 'Asia/Macau', MN: 'Asia/Ulaanbaatar',
  VN: 'Asia/Ho_Chi_Minh', SG: 'Asia/Singapore', MY: 'Asia/Kuala_Lumpur',
  ID: 'Asia/Jakarta', PH: 'Asia/Manila', MM: 'Asia/Yangon',
  LA: 'Asia/Vientiane', KH: 'Asia/Phnom_Penh', BN: 'Asia/Brunei',
  IN: 'Asia/Kolkata', NP: 'Asia/Kathmandu', LK: 'Asia/Colombo',
  BD: 'Asia/Dhaka', MV: 'Indian/Maldives', BT: 'Asia/Thimphu', PK: 'Asia/Karachi',
  AE: 'Asia/Dubai', SA: 'Asia/Riyadh', QA: 'Asia/Qatar', OM: 'Asia/Muscat',
  JO: 'Asia/Amman', IL: 'Asia/Jerusalem', TR: 'Europe/Istanbul', GE: 'Asia/Tbilisi',
  FR: 'Europe/Paris', IT: 'Europe/Rome', GB: 'Europe/London',
  DE: 'Europe/Berlin', ES: 'Europe/Madrid', PT: 'Europe/Lisbon',
  NL: 'Europe/Amsterdam', BE: 'Europe/Brussels', CH: 'Europe/Zurich',
  AT: 'Europe/Vienna', IE: 'Europe/Dublin', LU: 'Europe/Luxembourg', MC: 'Europe/Monaco',
  SE: 'Europe/Stockholm', NO: 'Europe/Oslo', DK: 'Europe/Copenhagen',
  FI: 'Europe/Helsinki', IS: 'Atlantic/Reykjavik',
  CZ: 'Europe/Prague', PL: 'Europe/Warsaw', HU: 'Europe/Budapest',
  HR: 'Europe/Zagreb', GR: 'Europe/Athens', RU: 'Europe/Moscow',
  US: 'America/New_York', CA: 'America/Toronto', MX: 'America/Mexico_City',
  BR: 'America/Sao_Paulo', AR: 'America/Buenos_Aires', PE: 'America/Lima',
  CL: 'America/Santiago', CU: 'America/Havana',
  AU: 'Australia/Sydney', NZ: 'Pacific/Auckland', FJ: 'Pacific/Fiji',
  EG: 'Africa/Cairo', MA: 'Africa/Casablanca', ZA: 'Africa/Johannesburg',
  KE: 'Africa/Nairobi', TZ: 'Africa/Dar_es_Salaam',
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

        {/* Popular quick-select */}
        <p className="text-[10px] text-gray-400 font-medium mb-2">ประเทศยอดนิยม</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {popularCountries.map((country) => (
            <button
              key={country.iso2}
              type="button"
              onClick={() => toggleCountry(country.iso2)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all text-sm ${
                selectedCountries.includes(country.iso2)
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                  : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-gray-700'
              }`}
            >
              <span>{country.emoji}</span>
              <span className="text-xs">{country.nameTh}</span>
            </button>
          ))}
        </div>

        {/* Searchable dropdown */}
        <CountryDropdown
          selected={selectedCountries}
          onToggle={toggleCountry}
        />

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
                const country = allCountries.find(cc => cc.iso2 === c)
                return (
                  <button key={c} type="button" onClick={() => toggleCountry(c)}
                    className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium hover:bg-red-100 hover:text-red-600 transition-colors">
                    {country?.emoji} {country?.nameTh} ×
                  </button>
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

function CountryDropdown({ selected, onToggle }: { selected: string[]; onToggle: (iso2: string) => void }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = search.trim()
    ? allCountries.filter(c =>
        c.nameTh.includes(search) ||
        c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        c.iso2.toLowerCase().includes(search.toLowerCase())
      )
    : allCountries

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 bg-gray-50/50 cursor-pointer hover:border-indigo-300 transition-colors flex items-center justify-between"
      >
        <span>ค้นหาประเทศเพิ่มเติม ({allCountries.length} ประเทศ)</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="พิมพ์ชื่อประเทศ (ไทย / EN / รหัส)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center py-4 text-sm text-gray-400">ไม่พบประเทศ</p>
            ) : (
              filtered.map(c => {
                const isSelected = selected.includes(c.iso2)
                return (
                  <button
                    key={c.iso2}
                    type="button"
                    onClick={() => onToggle(c.iso2)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-indigo-50/50 transition-colors ${
                      isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-lg">{c.emoji}</span>
                    <span className="flex-1">{c.nameTh} <span className="text-gray-400 text-xs">({c.nameEn})</span></span>
                    <span className="text-[10px] text-gray-400 font-mono">{c.iso2}</span>
                    {isSelected && <span className="text-indigo-500 font-bold">✓</span>}
                  </button>
                )
              })
            )}
          </div>

          {/* Close */}
          <div className="p-2 border-t border-gray-100">
            <button type="button" onClick={() => { setOpen(false); setSearch('') }}
              className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium">
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
