'use client'

import { useState } from 'react'

const allCountries = [
  { iso2: 'CN', nameTh: 'จีน', emoji: '🇨🇳' }, { iso2: 'JP', nameTh: 'ญี่ปุ่น', emoji: '🇯🇵' },
  { iso2: 'KR', nameTh: 'เกาหลีใต้', emoji: '🇰🇷' }, { iso2: 'TW', nameTh: 'ไต้หวัน', emoji: '🇹🇼' },
  { iso2: 'HK', nameTh: 'ฮ่องกง', emoji: '🇭🇰' }, { iso2: 'MO', nameTh: 'มาเก๊า', emoji: '🇲🇴' },
  { iso2: 'VN', nameTh: 'เวียดนาม', emoji: '🇻🇳' }, { iso2: 'SG', nameTh: 'สิงคโปร์', emoji: '🇸🇬' },
  { iso2: 'MY', nameTh: 'มาเลเซีย', emoji: '🇲🇾' }, { iso2: 'ID', nameTh: 'อินโดนีเซีย', emoji: '🇮🇩' },
  { iso2: 'PH', nameTh: 'ฟิลิปปินส์', emoji: '🇵🇭' }, { iso2: 'MM', nameTh: 'เมียนมา', emoji: '🇲🇲' },
  { iso2: 'LA', nameTh: 'ลาว', emoji: '🇱🇦' }, { iso2: 'KH', nameTh: 'กัมพูชา', emoji: '🇰🇭' },
  { iso2: 'IN', nameTh: 'อินเดีย', emoji: '🇮🇳' }, { iso2: 'NP', nameTh: 'เนปาล', emoji: '🇳🇵' },
  { iso2: 'LK', nameTh: 'ศรีลังกา', emoji: '🇱🇰' }, { iso2: 'MV', nameTh: 'มัลดีฟส์', emoji: '🇲🇻' },
  { iso2: 'BT', nameTh: 'ภูฏาน', emoji: '🇧🇹' }, { iso2: 'AE', nameTh: 'UAE', emoji: '🇦🇪' },
  { iso2: 'SA', nameTh: 'ซาอุดีอาระเบีย', emoji: '🇸🇦' }, { iso2: 'QA', nameTh: 'กาตาร์', emoji: '🇶🇦' },
  { iso2: 'TR', nameTh: 'ตุรกี', emoji: '🇹🇷' }, { iso2: 'GE', nameTh: 'จอร์เจีย', emoji: '🇬🇪' },
  { iso2: 'JO', nameTh: 'จอร์แดน', emoji: '🇯🇴' }, { iso2: 'IL', nameTh: 'อิสราเอล', emoji: '🇮🇱' },
  { iso2: 'FR', nameTh: 'ฝรั่งเศส', emoji: '🇫🇷' }, { iso2: 'IT', nameTh: 'อิตาลี', emoji: '🇮🇹' },
  { iso2: 'GB', nameTh: 'อังกฤษ', emoji: '🇬🇧' }, { iso2: 'DE', nameTh: 'เยอรมนี', emoji: '🇩🇪' },
  { iso2: 'ES', nameTh: 'สเปน', emoji: '🇪🇸' }, { iso2: 'PT', nameTh: 'โปรตุเกส', emoji: '🇵🇹' },
  { iso2: 'NL', nameTh: 'เนเธอร์แลนด์', emoji: '🇳🇱' }, { iso2: 'CH', nameTh: 'สวิตเซอร์แลนด์', emoji: '🇨🇭' },
  { iso2: 'AT', nameTh: 'ออสเตรีย', emoji: '🇦🇹' }, { iso2: 'SE', nameTh: 'สวีเดน', emoji: '🇸🇪' },
  { iso2: 'NO', nameTh: 'นอร์เวย์', emoji: '🇳🇴' }, { iso2: 'DK', nameTh: 'เดนมาร์ก', emoji: '🇩🇰' },
  { iso2: 'FI', nameTh: 'ฟินแลนด์', emoji: '🇫🇮' }, { iso2: 'IS', nameTh: 'ไอซ์แลนด์', emoji: '🇮🇸' },
  { iso2: 'CZ', nameTh: 'เช็ก', emoji: '🇨🇿' }, { iso2: 'PL', nameTh: 'โปแลนด์', emoji: '🇵🇱' },
  { iso2: 'HU', nameTh: 'ฮังการี', emoji: '🇭🇺' }, { iso2: 'HR', nameTh: 'โครเอเชีย', emoji: '🇭🇷' },
  { iso2: 'GR', nameTh: 'กรีซ', emoji: '🇬🇷' }, { iso2: 'RU', nameTh: 'รัสเซีย', emoji: '🇷🇺' },
  { iso2: 'US', nameTh: 'อเมริกา', emoji: '🇺🇸' }, { iso2: 'CA', nameTh: 'แคนาดา', emoji: '🇨🇦' },
  { iso2: 'MX', nameTh: 'เม็กซิโก', emoji: '🇲🇽' }, { iso2: 'BR', nameTh: 'บราซิล', emoji: '🇧🇷' },
  { iso2: 'AU', nameTh: 'ออสเตรเลีย', emoji: '🇦🇺' }, { iso2: 'NZ', nameTh: 'นิวซีแลนด์', emoji: '🇳🇿' },
  { iso2: 'EG', nameTh: 'อียิปต์', emoji: '🇪🇬' }, { iso2: 'MA', nameTh: 'โมร็อกโก', emoji: '🇲🇦' },
  { iso2: 'ZA', nameTh: 'แอฟริกาใต้', emoji: '🇿🇦' }, { iso2: 'KE', nameTh: 'เคนยา', emoji: '🇰🇪' },
]

const countryMap = Object.fromEntries(allCountries.map(c => [c.iso2, c]))

const commonCurrencies = [
  { code: 'THB', label: '🇹🇭 THB — บาท' },
  { code: 'CNY', label: '🇨🇳 CNY — หยวน' },
  { code: 'JPY', label: '🇯🇵 JPY — เยน' },
  { code: 'KRW', label: '🇰🇷 KRW — วอน' },
  { code: 'USD', label: '🇺🇸 USD — ดอลลาร์' },
  { code: 'EUR', label: '🇪🇺 EUR — ยูโร' },
  { code: 'GBP', label: '🇬🇧 GBP — ปอนด์' },
  { code: 'SGD', label: '🇸🇬 SGD — ดอลลาร์สิงคโปร์' },
  { code: 'MYR', label: '🇲🇾 MYR — ริงกิต' },
  { code: 'TWD', label: '🇹🇼 TWD — ดอลลาร์ไต้หวัน' },
  { code: 'VND', label: '🇻🇳 VND — ดอง' },
  { code: 'HKD', label: '🇭🇰 HKD — ดอลลาร์ฮ่องกง' },
  { code: 'AUD', label: '🇦🇺 AUD — ดอลลาร์ออสเตรเลีย' },
  { code: 'INR', label: '🇮🇳 INR — รูปี' },
  { code: 'CHF', label: '🇨🇭 CHF — ฟรังก์' },
]

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isCustom = value !== '' && !commonCurrencies.some(c => c.code === value)
  const [custom, setCustom] = useState(isCustom)

  if (custom) {
    return (
      <div className="flex gap-1">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          className="flex-1 w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="เช่น LAK, MMK"
          maxLength={3}
        />
        <button
          type="button"
          onClick={() => setCustom(false)}
          className="px-2 text-xs text-gray-400 hover:text-blue-600"
          title="เลือกจากรายการ"
        >
          ▼
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-1">
      <select
        value={commonCurrencies.some(c => c.code === value) ? value : ''}
        onChange={e => {
          if (e.target.value === '__custom__') {
            setCustom(true)
            onChange('')
          } else {
            onChange(e.target.value)
          }
        }}
        className="flex-1 w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">— เลือกสกุลเงิน —</option>
        {commonCurrencies.map(c => (
          <option key={c.code} value={c.code}>{c.label}</option>
        ))}
        <option value="__custom__">✏️ พิมพ์เอง...</option>
      </select>
    </div>
  )
}

interface TourInfo {
  id: string
  title: string
  titleEn: string | null
  description: string | null
  countries: string[]
  primaryCountry: string
  cities: string[]
  startDate: string
  endDate: string
  timezone: string
  maxMembers: number | null
  tourCode: string | null
  currency: string
  destCurrency: string | null
  isChina: boolean
}

const commonTimezones = [
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Ho_Chi_Minh',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
]

export default function TourInfoEditor({ tour }: { tour: TourInfo }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: tour.title,
    titleEn: tour.titleEn ?? '',
    description: tour.description ?? '',
    countries: tour.countries.join(', '),
    primaryCountry: tour.primaryCountry,
    cities: tour.cities.join(', '),
    startDate: new Date(tour.startDate).toISOString().split('T')[0],
    endDate: new Date(tour.endDate).toISOString().split('T')[0],
    timezone: tour.timezone,
    maxMembers: tour.maxMembers?.toString() ?? '',
    tourCode: tour.tourCode ?? '',
    currency: tour.currency,
    destCurrency: tour.destCurrency ?? '',
  })
  const [current, setCurrent] = useState(tour)

  async function save() {
    setSaving(true)
    try {
      const countriesArr = form.countries.split(',').map(c => c.trim()).filter(Boolean)
      const citiesArr = form.cities.split(',').map(c => c.trim()).filter(Boolean)
      const isChina = countriesArr.includes('CN')

      const body = {
        title: form.title.trim(),
        titleEn: form.titleEn.trim() || null,
        description: form.description.trim() || null,
        countries: countriesArr,
        primaryCountry: form.primaryCountry.trim() || countriesArr[0] || tour.primaryCountry,
        cities: citiesArr,
        startDate: new Date(form.startDate || tour.startDate).toISOString(),
        endDate: new Date(form.endDate || tour.endDate).toISOString(),
        timezone: form.timezone,
        maxMembers: form.maxMembers ? parseInt(form.maxMembers, 10) : null,
        tourCode: form.tourCode.trim() || null,
        currency: form.currency.trim() || 'THB',
        destCurrency: form.destCurrency.trim() || null,
        isChina,
      }

      const res = await fetch(`/api/tours/${tour.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const updated = await res.json()
        setCurrent({
          ...current,
          ...updated,
          startDate: updated.startDate,
          endDate: updated.endDate,
        })
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500'

  if (editing) {
    return (
      <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">ข้อมูลทัวร์</h3>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">ชื่อทัวร์ (ไทย)</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className={inputCls}
              placeholder="ชื่อทัวร์ภาษาไทย"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">ชื่อทัวร์ (EN)</label>
            <input
              type="text"
              value={form.titleEn}
              onChange={e => setForm(p => ({ ...p, titleEn: e.target.value }))}
              className={inputCls}
              placeholder="Tour title in English"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">รายละเอียด</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="รายละเอียดทัวร์"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">ประเทศ</label>
            {/* Selected tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {form.countries.split(',').map(c => c.trim()).filter(Boolean).map(code => {
                const c = countryMap[code]
                return (
                  <button key={code} type="button"
                    onClick={() => setForm(p => ({ ...p, countries: p.countries.split(',').map(x => x.trim()).filter(x => x !== code).join(', ') }))}
                    className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-medium hover:bg-red-50 hover:text-red-600 transition-colors">
                    {c?.emoji ?? '🌍'} {c?.nameTh ?? code} ×
                  </button>
                )
              })}
            </div>
            {/* Dropdown */}
            <select
              value=""
              onChange={e => {
                const code = e.target.value
                if (!code) return
                const current = form.countries.split(',').map(c => c.trim()).filter(Boolean)
                if (!current.includes(code)) {
                  const updated = [...current, code].join(', ')
                  setForm(p => ({ ...p, countries: updated, primaryCountry: current.length === 0 ? code : p.primaryCountry }))
                }
              }}
              className={inputCls}
            >
              <option value="">+ เพิ่มประเทศ...</option>
              {allCountries.map(c => (
                <option key={c.iso2} value={c.iso2}>{c.emoji} {c.nameTh} ({c.iso2})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">ประเทศหลัก</label>
            <select
              value={form.primaryCountry}
              onChange={e => setForm(p => ({ ...p, primaryCountry: e.target.value }))}
              className={inputCls}
            >
              {form.countries.split(',').map(c => c.trim()).filter(Boolean).map(code => {
                const c = countryMap[code]
                return <option key={code} value={code}>{c?.emoji ?? '🌍'} {c?.nameTh ?? code}</option>
              })}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">เมือง (คั่นด้วย ,)</label>
            <input
              type="text"
              value={form.cities}
              onChange={e => setForm(p => ({ ...p, cities: e.target.value }))}
              className={inputCls}
              placeholder="โตเกียว, ฟูจิ, เกียวโต"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-0.5 block">วันเริ่มต้น</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-0.5 block">วันสิ้นสุด</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">Timezone</label>
            <select
              value={form.timezone}
              onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
              className={inputCls}
            >
              {commonTimezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-0.5 block">จำนวนสูงสุด</label>
              <input
                type="number"
                value={form.maxMembers}
                onChange={e => setForm(p => ({ ...p, maxMembers: e.target.value }))}
                className={inputCls}
                placeholder="ไม่จำกัด"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-0.5 block">Tour Code</label>
              <input
                type="text"
                value={form.tourCode}
                onChange={e => setForm(p => ({ ...p, tourCode: e.target.value }))}
                className={inputCls}
                placeholder="JP2026-04"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-0.5 block">สกุลเงินหลัก</label>
              <CurrencySelect value={form.currency} onChange={v => setForm(p => ({ ...p, currency: v }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-0.5 block">สกุลเงินปลายทาง</label>
              <CurrencySelect value={form.destCurrency} onChange={v => setForm(p => ({ ...p, destCurrency: v }))} />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving || !form.title.trim()}
              className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button
              onClick={() => {
                setForm({
                  title: current.title,
                  titleEn: current.titleEn ?? '',
                  description: current.description ?? '',
                  countries: current.countries.join(', '),
                  primaryCountry: current.primaryCountry,
                  cities: current.cities.join(', '),
                  startDate: new Date(current.startDate).toISOString().split('T')[0],
                  endDate: new Date(current.endDate).toISOString().split('T')[0],
                  timezone: current.timezone,
                  maxMembers: current.maxMembers?.toString() ?? '',
                  tourCode: current.tourCode ?? '',
                  currency: current.currency,
                  destCurrency: current.destCurrency ?? '',
                })
                setEditing(false)
              }}
              className="px-3 py-1.5 border border-gray-200 bg-white text-gray-600 rounded-lg text-xs"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    )
  }

  const infoItems = [
    { label: 'ประเทศ', value: current.countries.join(', '), icon: '🌍' },
    { label: 'เมือง', value: current.cities.join(', ') || '-', icon: '🏙️' },
    { label: 'วันเดินทาง', value: `${new Date(current.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} — ${new Date(current.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`, icon: '📅' },
    { label: 'จำนวนสูงสุด', value: current.maxMembers?.toString() ?? 'ไม่จำกัด', icon: '👥' },
    ...(current.tourCode ? [{ label: 'Tour Code', value: current.tourCode, icon: '🏷️' }] : []),
    ...(current.destCurrency ? [{ label: 'สกุลเงิน', value: `${current.currency} → ${current.destCurrency}`, icon: '💱' }] : []),
  ]

  return (
    <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <h3 className="font-bold text-gray-900 text-sm">รายละเอียด</h3>
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
        >
          แก้ไข
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {infoItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/50 transition-colors">
            <span className="text-sm w-5 text-center flex-shrink-0">{item.icon}</span>
            <span className="text-xs text-gray-400 w-20 flex-shrink-0">{item.label}</span>
            <span className="text-xs text-gray-900 font-medium flex-1 text-right truncate">{item.value}</span>
          </div>
        ))}
        {current.isChina && (
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-sm w-5 text-center flex-shrink-0">🇨🇳</span>
            <span className="text-xs text-gray-400 w-20 flex-shrink-0">China Mode</span>
            <span className="text-xs text-red-600 font-bold flex-1 text-right">เปิด</span>
          </div>
        )}
      </div>
    </div>
  )
}
