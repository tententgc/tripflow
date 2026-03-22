'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface Flight {
  id: string
  flightNo: string
  airline: string
  airlineIata: string | null
  fromAirport: string
  fromIata: string
  toAirport: string
  toIata: string
  departAt: string | Date
  arriveAt: string | Date
  departTz: string
  arriveTz: string
  terminal: string | null
  gate: string | null
}

type FlightForm = {
  flightNo: string
  airline: string
  airlineIata: string
  fromAirport: string
  fromIata: string
  toAirport: string
  toIata: string
  departAt: string
  arriveAt: string
  departTz: string
  arriveTz: string
  terminal: string
  gate: string
}

const emptyForm: FlightForm = {
  flightNo: '',
  airline: '',
  airlineIata: '',
  fromAirport: '',
  fromIata: '',
  toAirport: '',
  toIata: '',
  departAt: '',
  arriveAt: '',
  departTz: 'Asia/Bangkok',
  arriveTz: 'Asia/Bangkok',
  terminal: '',
  gate: '',
}

function toLocalDatetime(d: string | Date): string {
  const date = new Date(d)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function flightToForm(f: Flight): FlightForm {
  return {
    flightNo: f.flightNo,
    airline: f.airline,
    airlineIata: f.airlineIata ?? '',
    fromAirport: f.fromAirport,
    fromIata: f.fromIata,
    toAirport: f.toAirport,
    toIata: f.toIata,
    departAt: toLocalDatetime(f.departAt),
    arriveAt: toLocalDatetime(f.arriveAt),
    departTz: f.departTz,
    arriveTz: f.arriveTz,
    terminal: f.terminal ?? '',
    gate: f.gate ?? '',
  }
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

/* ── Modal Form ──────────────────────────────────────── */
function FlightFormModal({
  initial,
  tourId,
  flightId,
  onSave,
  onCancel,
  onDelete,
  title,
  submitLabel,
}: {
  initial: FlightForm
  tourId: string
  flightId?: string
  onSave: (flight: Flight) => void
  onCancel: () => void
  onDelete?: () => void
  title: string
  submitLabel: string
}) {
  const [form, setForm] = useState<FlightForm>(initial)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [looking, setLooking] = useState(false)
  const [lookupErr, setLookupErr] = useState('')
  const [showDetails, setShowDetails] = useState(!!flightId)
  const [searchFlightNo, setSearchFlightNo] = useState(initial.flightNo)
  const [searchDate, setSearchDate] = useState(initial.departAt ? initial.departAt.split('T')[0] : '')

  async function lookupFlight() {
    if (!searchFlightNo.trim()) return
    setLooking(true)
    setLookupErr('')
    try {
      const dateParam = searchDate ? `&date=${searchDate}` : ''
      const res = await fetch(`/api/flights/lookup?flight=${encodeURIComponent(searchFlightNo.trim())}${dateParam}`)
      const data = await res.json()
      if (!res.ok || !data.found) {
        setLookupErr(data.error ?? 'ไม่พบเที่ยวบินนี้')
        return
      }
      setForm({
        flightNo: data.flightNo ?? searchFlightNo.trim().toUpperCase(),
        airline: data.airline ?? '',
        airlineIata: data.airlineIata ?? '',
        fromAirport: data.fromAirport ?? '',
        fromIata: data.fromIata ?? '',
        toAirport: data.toAirport ?? '',
        toIata: data.toIata ?? '',
        departAt: data.departAt ? toLocalDatetime(data.departAt) : '',
        arriveAt: data.arriveAt ? toLocalDatetime(data.arriveAt) : '',
        departTz: data.departTz ?? 'Asia/Bangkok',
        arriveTz: data.arriveTz ?? 'Asia/Bangkok',
        terminal: data.terminal ?? '',
        gate: data.gate ?? '',
      })
      setShowDetails(true)
    } catch {
      setLookupErr('เกิดข้อผิดพลาด')
    } finally {
      setLooking(false)
    }
  }

  async function save() {
    if (!form.flightNo.trim() || !form.airline.trim()) return
    setSaving(true)
    try {
      const url = flightId
        ? `/api/tours/${tourId}/flights/${flightId}`
        : `/api/tours/${tourId}/flights`
      const res = await fetch(url, {
        method: flightId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightNo: form.flightNo.trim(),
          airline: form.airline.trim(),
          airlineIata: form.airlineIata.trim() || null,
          fromAirport: form.fromAirport.trim(),
          fromIata: form.fromIata.trim().toUpperCase(),
          toAirport: form.toAirport.trim(),
          toIata: form.toIata.trim().toUpperCase(),
          departAt: new Date(form.departAt).toISOString(),
          arriveAt: new Date(form.arriveAt).toISOString(),
          departTz: form.departTz,
          arriveTz: form.arriveTz,
          terminal: form.terminal.trim() || null,
          gate: form.gate.trim() || null,
        }),
      })
      if (res.ok) onSave(await res.json() as Flight)
    } finally {
      setSaving(false)
    }
  }

  async function deleteFlight() {
    if (!flightId || !confirm('ลบเที่ยวบินนี้?')) return
    setDeleting(true)
    try {
      await fetch(`/api/tours/${tourId}/flights/${flightId}`, { method: 'DELETE' })
      onDelete?.()
    } finally {
      setDeleting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400'

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-sky-50 px-5 py-3.5 border-b border-sky-100">
            <h3 className="font-semibold text-sky-800 text-sm">{title}</h3>
            <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-sky-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-h-[75vh] overflow-y-auto">
            {/* Left — Search + Route */}
            <div className="p-5 space-y-4 border-r border-gray-100">
              {/* Flight search */}
              <div className="bg-sky-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-sky-700 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                  ค้นหาเที่ยวบิน
                </p>
                <div className="flex gap-2">
                  <input type="text" value={searchFlightNo}
                    onChange={(e) => setSearchFlightNo(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && lookupFlight()}
                    className="flex-1 px-3 py-2.5 border border-sky-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    placeholder="เลขเที่ยวบิน (TG676)" autoFocus />
                  <input type="date" value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && lookupFlight()}
                    className="px-3 py-2.5 border border-sky-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                </div>
                <button type="button" onClick={lookupFlight} disabled={looking || !searchFlightNo.trim()}
                  className="w-full py-2.5 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors">
                  {looking ? 'กำลังค้นหา...' : 'ค้นหา'}
                </button>
                {lookupErr && <p className="text-xs text-red-500">{lookupErr}</p>}
              </div>

              {/* Route info */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">สายการบิน *</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={form.airline} onChange={(e) => setForm((p) => ({ ...p, airline: e.target.value }))}
                    className={`col-span-2 ${inputCls}`} placeholder="Thai Airways" />
                  <input type="text" value={form.airlineIata} onChange={(e) => setForm((p) => ({ ...p, airlineIata: e.target.value }))}
                    className={inputCls} placeholder="IATA (TG)" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">สนามบินต้นทาง</label>
                  <input type="text" value={form.fromAirport} onChange={(e) => setForm((p) => ({ ...p, fromAirport: e.target.value }))}
                    className={inputCls} placeholder="Suvarnabhumi" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">IATA ต้นทาง</label>
                  <input type="text" value={form.fromIata} onChange={(e) => setForm((p) => ({ ...p, fromIata: e.target.value }))}
                    className={inputCls} placeholder="BKK" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">สนามบินปลายทาง</label>
                  <input type="text" value={form.toAirport} onChange={(e) => setForm((p) => ({ ...p, toAirport: e.target.value }))}
                    className={inputCls} placeholder="Narita" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">IATA ปลายทาง</label>
                  <input type="text" value={form.toIata} onChange={(e) => setForm((p) => ({ ...p, toIata: e.target.value }))}
                    className={inputCls} placeholder="NRT" />
                </div>
              </div>
            </div>

            {/* Right — Times + Terminal + Actions */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">เวลาออกเดินทาง</label>
                  <input type="datetime-local" value={form.departAt}
                    onChange={(e) => setForm((p) => ({ ...p, departAt: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">เวลาถึง</label>
                  <input type="datetime-local" value={form.arriveAt}
                    onChange={(e) => setForm((p) => ({ ...p, arriveAt: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Timezone ต้นทาง</label>
                  <select value={form.departTz} onChange={(e) => setForm((p) => ({ ...p, departTz: e.target.value }))}
                    className={inputCls}>
                    {commonTimezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Timezone ปลายทาง</label>
                  <select value={form.arriveTz} onChange={(e) => setForm((p) => ({ ...p, arriveTz: e.target.value }))}
                    className={inputCls}>
                    {commonTimezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Terminal</label>
                  <input type="text" value={form.terminal} onChange={(e) => setForm((p) => ({ ...p, terminal: e.target.value }))}
                    className={inputCls} placeholder="Terminal" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Gate</label>
                  <input type="text" value={form.gate} onChange={(e) => setForm((p) => ({ ...p, gate: e.target.value }))}
                    className={inputCls} placeholder="Gate" />
                </div>
              </div>

              {/* Flight preview */}
              {showDetails && form.flightNo && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{form.flightNo}</span>
                    <span className="text-xs text-gray-400">{form.airline}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {form.fromAirport} ({form.fromIata}) → {form.toAirport} ({form.toIata})
                  </p>
                  {form.departAt && form.arriveAt && (
                    <p className="text-[10px] text-gray-400">
                      {form.departAt.replace('T', ' ')} → {form.arriveAt.replace('T', ' ')}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button onClick={save}
                  disabled={saving || !form.flightNo.trim() || !form.airline.trim()}
                  className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-sky-700 transition-colors">
                  {saving ? 'กำลังบันทึก...' : submitLabel}
                </button>
                <button onClick={onCancel}
                  className="px-5 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  ยกเลิก
                </button>
                {flightId && (
                  <button onClick={deleteFlight} disabled={deleting}
                    className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50" title="ลบเที่ยวบิน">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── Main Component ──────────────────────────────────── */
export default function FlightsManager({
  tourId,
  initialFlights,
}: {
  tourId: string
  initialFlights: Flight[]
}) {
  const [flights, setFlights] = useState<Flight[]>(initialFlights)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function formatTime(d: string | Date): string {
    return new Date(d).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const editingFlight = editingId ? flights.find(f => f.id === editingId) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">เที่ยวบิน ({flights.length})</h2>
      </div>

      {flights.length === 0 && !adding && (
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 text-center border border-white/60">
          <p className="text-3xl mb-2">✈️</p>
          <p className="text-gray-600 font-medium">ยังไม่มีเที่ยวบิน</p>
          <p className="text-gray-400 text-sm mt-1">เพิ่มเที่ยวบินสำหรับทัวร์นี้</p>
          <button onClick={() => setAdding(true)}
            className="mt-4 px-5 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors">
            + เพิ่มเที่ยวบิน
          </button>
        </div>
      )}

      {flights.map((flight) => (
        <div key={flight.id}
          className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {flight.airlineIata ? (
                <img
                  src={`https://pics.avs.io/80/80/${flight.airlineIata}.png`}
                  alt={flight.airline}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xl">✈️</span>' }}
                />
              ) : (
                <span className="text-xl">✈️</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{flight.flightNo}</span>
                <span className="text-xs text-gray-400">{flight.airline}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {flight.fromIata} → {flight.toIata}
                {' · '}
                {formatTime(flight.departAt)} → {formatTime(flight.arriveAt)}
              </p>
              {(flight.terminal || flight.gate) && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {flight.terminal && `Terminal ${flight.terminal}`}
                  {flight.terminal && flight.gate && ' · '}
                  {flight.gate && `Gate ${flight.gate}`}
                </p>
              )}
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => { setEditingId(flight.id); setAdding(false) }}
                className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="แก้ไข">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              </button>
              <button onClick={async (e) => { e.stopPropagation(); if (!confirm('ลบเที่ยวบินนี้?')) return; await fetch(`/api/tours/${tourId}/flights/${flight.id}`, { method: 'DELETE' }); setFlights(prev => prev.filter(f => f.id !== flight.id)) }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="ลบ">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
            </div>
          </div>
        </div>
      ))}

      {flights.length > 0 && (
        <button onClick={() => { setAdding(true); setEditingId(null) }}
          className="w-full py-3 bg-white/30 backdrop-blur-sm border border-dashed border-sky-200/60 text-sky-500 rounded-2xl text-sm font-medium hover:bg-white/50 hover:border-sky-300 transition-colors">
          + เพิ่มเที่ยวบิน
        </button>
      )}

      {/* Add Modal */}
      {adding && (
        <FlightFormModal
          initial={emptyForm}
          tourId={tourId}
          title="เพิ่มเที่ยวบินใหม่"
          submitLabel="เพิ่มเที่ยวบิน"
          onSave={(flight) => { setFlights((prev) => [...prev, flight]); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* Edit Modal */}
      {editingFlight && (
        <FlightFormModal
          initial={flightToForm(editingFlight)}
          tourId={tourId}
          flightId={editingFlight.id}
          title={`แก้ไข "${editingFlight.flightNo}"`}
          submitLabel="บันทึก"
          onSave={(updated) => { setFlights((prev) => prev.map((f) => (f.id === editingFlight.id ? updated : f))); setEditingId(null) }}
          onCancel={() => setEditingId(null)}
          onDelete={() => { setFlights((prev) => prev.filter((f) => f.id !== editingFlight.id)); setEditingId(null) }}
        />
      )}
    </div>
  )
}
