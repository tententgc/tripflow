'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Tour {
  id: string
  status: string
}

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  DRAFT:     { label: 'ฉบับร่าง',     dot: 'bg-gray-400',   bg: 'bg-gray-50',    text: 'text-gray-600',   border: 'border-gray-200' },
  PUBLISHED: { label: 'เผยแพร่แล้ว',  dot: 'bg-blue-500',   bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
  ACTIVE:    { label: 'กำลังเดินทาง', dot: 'bg-green-500',  bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200' },
  COMPLETED: { label: 'เสร็จสิ้น',    dot: 'bg-violet-500', bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200' },
  CANCELLED: { label: 'ยกเลิก',       dot: 'bg-red-500',    bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200' },
}

export default function TourDetailClient({ tour }: { tour: Tour }) {
  const router = useRouter()
  const [status, setStatus] = useState(tour.status)
  const [updating, setUpdating] = useState(false)
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const dropdownWidth = 192
      // Align right edge of dropdown to right edge of button
      const left = rect.right - dropdownWidth
      setPos({ top: rect.bottom + 8, left: Math.max(16, left) })
    }
  }, [open])

  const current = statusConfig[status] ?? statusConfig['DRAFT']!

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    setOpen(false)
    try {
      const res = await fetch(`/api/tours/${tour.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setStatus(newStatus)
        router.refresh()
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Status button */}
      <div className="relative">
        <button
          ref={btnRef}
          onClick={() => setOpen(v => !v)}
          disabled={updating}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${current.bg} ${current.text} ${current.border} hover:shadow-md disabled:opacity-50`}
        >
          <span className={`w-2 h-2 rounded-full ${current.dot} ${status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
          {current.label}
          <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="fixed w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
              style={{ top: pos.top, left: pos.left }}
            >
              {Object.entries(statusConfig).map(([value, cfg]) => (
                <button
                  key={value}
                  onClick={() => updateStatus(value)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                    status === value ? `${cfg.bg} ${cfg.text} font-semibold` : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                  {status === value && <span className="ml-auto text-xs">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Open traveler app */}
      <a
        href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/tour/${tour.id}/today`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all duration-200"
      >
        เปิดแอป
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>
    </div>
  )
}
