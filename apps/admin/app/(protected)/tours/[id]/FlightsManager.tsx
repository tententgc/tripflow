'use client'

import { useState } from 'react'

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

function FlightFormInline({
  initial,
  tourId,
  flightId,
  onSave,
  onCancel,
  onDelete,
  submitLabel,
}: {
  initial: FlightForm
  tourId: string
  flightId?: string
  onSave: (flight: Flight) => void
  onCancel: () => void
  onDelete?: () => void
  submitLabel: string
}) {
  const [form, setForm] = useState<FlightForm>(initial)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [looking, setLooking] = useState(false)
  const [lookupErr, setLookupErr] = useState('')
  // Show detail fields after successful lookup or when editing existing flight
  const [showDetails, setShowDetails] = useState(!!flightId)
  // Separate search inputs for flight number and date
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

  const inputCls = 'px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="bg-blue-50 rounded-xl p-3 space-y-2">
      {/* Step 1: Flight number + date search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchFlightNo}
          onChange={(e) => setSearchFlightNo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && lookupFlight()}
          className={`flex-1 ${inputCls}`}
          placeholder="เลขเที่ยวบิน (TG676)"
          autoFocus
        />
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && lookupFlight()}
          className={inputCls}
        />
        <button
          type="button"
          onClick={lookupFlight}
          disabled={looking || !searchFlightNo.trim()}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-50 flex-shrink-0"
        >
          {looking ? 'กำลังค้นหา...' : 'ค้นหา'}
        </button>
      </div>
      {lookupErr && <p className="text-xs text-red-500">{lookupErr}</p>}

      {/* Step 2: Auto-filled details (shown after lookup or when editing) */}
      {showDetails && (
        <>
          {/* Summary of found flight */}
          <div className="bg-white rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{form.flightNo}</span>
              <span className="text-xs text-gray-400">{form.airline}</span>
              {form.airlineIata && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{form.airlineIata}</span>}
            </div>
            <p className="text-sm text-gray-600">
              {form.fromAirport} ({form.fromIata}) → {form.toAirport} ({form.toIata})
            </p>
            {form.departAt && form.arriveAt && (
              <p className="text-xs text-gray-500">
                {form.departAt.replace('T', ' ')} → {form.arriveAt.replace('T', ' ')}
              </p>
            )}
            {(form.terminal || form.gate) && (
              <p className="text-xs text-gray-400">
                {form.terminal && `Terminal ${form.terminal}`}
                {form.terminal && form.gate && ' · '}
                {form.gate && `Gate ${form.gate}`}
              </p>
            )}
          </div>

          {/* Editable fields (collapsed by default, expand to fine-tune) */}
          <details className="text-sm">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 py-1">
              แก้ไขรายละเอียด
            </summary>
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={form.airline}
                  onChange={(e) => setForm((p) => ({ ...p, airline: e.target.value }))}
                  className={inputCls}
                  placeholder="สายการบิน"
                />
                <input
                  type="text"
                  value={form.airlineIata}
                  onChange={(e) => setForm((p) => ({ ...p, airlineIata: e.target.value }))}
                  className={inputCls}
                  placeholder="IATA (TG)"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.fromAirport}
                  onChange={(e) => setForm((p) => ({ ...p, fromAirport: e.target.value }))}
                  className={inputCls}
                  placeholder="สนามบินต้นทาง"
                />
                <input
                  type="text"
                  value={form.fromIata}
                  onChange={(e) => setForm((p) => ({ ...p, fromIata: e.target.value }))}
                  className={inputCls}
                  placeholder="IATA ต้นทาง (BKK)"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.toAirport}
                  onChange={(e) => setForm((p) => ({ ...p, toAirport: e.target.value }))}
                  className={inputCls}
                  placeholder="สนามบินปลายทาง"
                />
                <input
                  type="text"
                  value={form.toIata}
                  onChange={(e) => setForm((p) => ({ ...p, toIata: e.target.value }))}
                  className={inputCls}
                  placeholder="IATA ปลายทาง (PEK)"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">เวลาออกเดินทาง</label>
                  <input
                    type="datetime-local"
                    value={form.departAt}
                    onChange={(e) => setForm((p) => ({ ...p, departAt: e.target.value }))}
                    className={`w-full ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">เวลาถึง</label>
                  <input
                    type="datetime-local"
                    value={form.arriveAt}
                    onChange={(e) => setForm((p) => ({ ...p, arriveAt: e.target.value }))}
                    className={`w-full ${inputCls}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Timezone ต้นทาง</label>
                  <select
                    value={form.departTz}
                    onChange={(e) => setForm((p) => ({ ...p, departTz: e.target.value }))}
                    className={`w-full ${inputCls}`}
                  >
                    {commonTimezones.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Timezone ปลายทาง</label>
                  <select
                    value={form.arriveTz}
                    onChange={(e) => setForm((p) => ({ ...p, arriveTz: e.target.value }))}
                    className={`w-full ${inputCls}`}
                  >
                    {commonTimezones.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.terminal}
                  onChange={(e) => setForm((p) => ({ ...p, terminal: e.target.value }))}
                  className={inputCls}
                  placeholder="Terminal"
                />
                <input
                  type="text"
                  value={form.gate}
                  onChange={(e) => setForm((p) => ({ ...p, gate: e.target.value }))}
                  className={inputCls}
                  placeholder="Gate"
                />
              </div>
            </div>
          </details>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !form.flightNo.trim() || !form.airline.trim()}
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
            {flightId && (
              <button
                onClick={deleteFlight}
                disabled={deleting}
                className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm disabled:opacity-50"
                title="ลบเที่ยวบิน"
              >
                🗑️
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">เที่ยวบิน ({flights.length})</h2>
      </div>

      {flights.length === 0 && !adding && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <p className="text-3xl mb-2">✈️</p>
          <p className="text-gray-600 font-medium">ยังไม่มีเที่ยวบิน</p>
          <p className="text-gray-400 text-sm mt-1">เพิ่มเที่ยวบินสำหรับทัวร์นี้</p>
        </div>
      )}

      {flights.map((flight) => (
        <div key={flight.id}>
          {editingId === flight.id ? (
            <FlightFormInline
              initial={flightToForm(flight)}
              tourId={tourId}
              flightId={flight.id}
              submitLabel="บันทึก"
              onSave={(updated) => {
                setFlights((prev) => prev.map((f) => (f.id === flight.id ? updated : f)))
                setEditingId(null)
              }}
              onCancel={() => setEditingId(null)}
              onDelete={() => {
                setFlights((prev) => prev.filter((f) => f.id !== flight.id))
                setEditingId(null)
              }}
            />
          ) : (
            <button
              onClick={() => { setEditingId(flight.id); setAdding(false) }}
              className="w-full flex items-center gap-3 p-3 bg-white hover:bg-blue-50 rounded-xl border border-gray-100 shadow-sm transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-lg">
                ✈️
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
                  <p className="text-xs text-gray-400 mt-0.5">
                    {flight.terminal && `Terminal ${flight.terminal}`}
                    {flight.terminal && flight.gate && ' · '}
                    {flight.gate && `Gate ${flight.gate}`}
                  </p>
                )}
              </div>
              <span className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 text-sm">✏️</span>
            </button>
          )}
        </div>
      ))}

      {adding ? (
        <FlightFormInline
          initial={emptyForm}
          tourId={tourId}
          submitLabel="เพิ่มเที่ยวบิน"
          onSave={(flight) => {
            setFlights((prev) => [...prev, flight])
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => { setAdding(true); setEditingId(null) }}
          className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-xl text-sm hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + เพิ่มเที่ยวบิน
        </button>
      )}
    </div>
  )
}
