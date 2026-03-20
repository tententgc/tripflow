'use client'

import { useState } from 'react'

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
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-0.5 block">ประเทศ (ISO2, คั่นด้วย ,)</label>
              <input
                type="text"
                value={form.countries}
                onChange={e => setForm(p => ({ ...p, countries: e.target.value }))}
                className={inputCls}
                placeholder="JP, KR"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-0.5 block">ประเทศหลัก</label>
              <input
                type="text"
                value={form.primaryCountry}
                onChange={e => setForm(p => ({ ...p, primaryCountry: e.target.value }))}
                className={inputCls}
                placeholder="JP"
              />
            </div>
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
              <input
                type="text"
                value={form.currency}
                onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                className={inputCls}
                placeholder="THB"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-0.5 block">สกุลเงินปลายทาง</label>
              <input
                type="text"
                value={form.destCurrency}
                onChange={e => setForm(p => ({ ...p, destCurrency: e.target.value }))}
                className={inputCls}
                placeholder="JPY"
              />
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

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">ข้อมูลทัวร์</h3>
        <button
          onClick={() => setEditing(true)}
          className="text-blue-600 text-xs hover:underline"
        >
          แก้ไข
        </button>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">ประเทศ</span>
          <span className="text-gray-900">{current.countries.join(', ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">เมือง</span>
          <span className="text-gray-900">{current.cities.join(', ') || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">วันเดินทาง</span>
          <span className="text-gray-900">
            {new Date(current.startDate).toLocaleDateString('th-TH')} — {new Date(current.endDate).toLocaleDateString('th-TH')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">จำนวนสูงสุด</span>
          <span className="text-gray-900">{current.maxMembers ?? 'ไม่จำกัด'}</span>
        </div>
        {current.tourCode && (
          <div className="flex justify-between">
            <span className="text-gray-500">Tour Code</span>
            <span className="text-gray-900 font-mono">{current.tourCode}</span>
          </div>
        )}
        {current.destCurrency && (
          <div className="flex justify-between">
            <span className="text-gray-500">สกุลเงินปลายทาง</span>
            <span className="text-gray-900">{current.destCurrency}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">China Mode</span>
          <span className={current.isChina ? 'text-red-600 font-medium' : 'text-gray-400'}>
            {current.isChina ? 'เปิด' : 'ปิด'}
          </span>
        </div>
      </div>
    </div>
  )
}
