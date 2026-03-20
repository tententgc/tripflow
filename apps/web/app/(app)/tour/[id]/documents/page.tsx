'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'

interface Document {
  id: string
  title: string
  titleEn: string | null
  type: string
  fileUrl: string | null
  qrData: string | null
  description: string | null
  isPersonal: boolean
}

interface TourBasic {
  id: string
  title: string
  isChina: boolean
  documents: Document[]
}

const typeConfig: Record<string, { label: string; emoji: string; gradient: string; textColor: string; badgeColor: string }> = {
  FLIGHT_TICKET:    { label: 'ตั๋วเครื่องบิน',    emoji: '✈️', gradient: 'from-blue-600 to-blue-800',     textColor: 'text-white', badgeColor: 'bg-blue-500' },
  HOTEL_VOUCHER:    { label: 'เวาเชอร์โรงแรม',    emoji: '🏨', gradient: 'from-violet-600 to-purple-800', textColor: 'text-white', badgeColor: 'bg-violet-500' },
  TOUR_VOUCHER:     { label: 'เวาเชอร์ทัวร์',      emoji: '🗺️', gradient: 'from-green-600 to-green-800',   textColor: 'text-white', badgeColor: 'bg-green-500' },
  VISA:             { label: 'วีซ่า',               emoji: '📋', gradient: 'from-red-600 to-red-800',       textColor: 'text-white', badgeColor: 'bg-red-500' },
  QR_CODE:          { label: 'QR Code',             emoji: '⬛', gradient: 'from-gray-700 to-gray-900',     textColor: 'text-white', badgeColor: 'bg-gray-600' },
  INSURANCE:        { label: 'ประกันเดินทาง',       emoji: '🛡️', gradient: 'from-teal-600 to-teal-800',    textColor: 'text-white', badgeColor: 'bg-teal-500' },
  PASSPORT:         { label: 'พาสปอร์ต',            emoji: '📘', gradient: 'from-indigo-600 to-violet-700', textColor: 'text-white', badgeColor: 'bg-indigo-500' },
  MAP:              { label: 'แผนที่',               emoji: '🗺️', gradient: 'from-amber-600 to-amber-800',  textColor: 'text-white', badgeColor: 'bg-amber-500' },
  VISIT_JAPAN_WEB:  { label: 'Visit Japan Web',     emoji: '🇯🇵', gradient: 'from-rose-600 to-rose-800',    textColor: 'text-white', badgeColor: 'bg-rose-500' },
  CHINA_HEALTH_KIT: { label: 'China Health Kit',    emoji: '🇨🇳', gradient: 'from-red-700 to-red-900',     textColor: 'text-white', badgeColor: 'bg-red-600' },
  OTHER:            { label: 'เอกสารอื่น',           emoji: '📄', gradient: 'from-slate-600 to-slate-800',  textColor: 'text-white', badgeColor: 'bg-slate-500' },
}

function TicketCard({ doc, active }: { doc: Document; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cfg = (typeConfig[doc.type] ?? typeConfig['OTHER'])!

  useEffect(() => {
    if (doc.qrData && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, doc.qrData, {
        width: 200, margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
    }
  }, [doc.qrData])

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
        active ? 'scale-100 opacity-100' : 'scale-95 opacity-50'
      }`}
      style={{ minHeight: 420 }}
    >
      <div className={`bg-gradient-to-br ${cfg.gradient} p-6 pb-8`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`text-xs font-semibold uppercase tracking-widest opacity-70 ${cfg.textColor}`}>
              {cfg.label}
            </span>
            <h2 className={`text-xl font-bold mt-1 ${cfg.textColor}`}>{doc.title}</h2>
            {doc.titleEn && <p className={`text-sm opacity-70 mt-0.5 ${cfg.textColor}`}>{doc.titleEn}</p>}
          </div>
          <span className="text-4xl">{cfg.emoji}</span>
        </div>
        {doc.description && <p className={`text-sm opacity-80 ${cfg.textColor}`}>{doc.description}</p>}
      </div>

      {/* Ticket notch */}
      <div className="relative bg-white flex items-center">
        <div className="absolute -left-4 w-8 h-8 rounded-full bg-gray-100" />
        <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-4" />
        <div className="absolute -right-4 w-8 h-8 rounded-full bg-gray-100" />
      </div>

      <div className="bg-white p-6 flex flex-col items-center">
        {doc.qrData ? (
          <>
            <canvas ref={canvasRef} className="rounded-xl shadow-md" />
            <p className="text-xs text-gray-400 mt-3 text-center">แสดง QR Code นี้ที่จุดตรวจ</p>
          </>
        ) : doc.fileUrl ? (
          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 py-8 text-indigo-600">
            <span className="text-5xl">📎</span>
            <span className="text-sm font-medium">เปิดเอกสาร</span>
          </a>
        ) : (
          <div className="py-8 text-center text-gray-400">
            <span className="text-4xl">📄</span>
            <p className="text-sm mt-2">ยังไม่มีไฟล์แนบ</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string
  const [tour, setTour] = useState<TourBasic | null>(null)
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => { setTour(data); setLoading(false) })
  }, [tourId])

  const docs = tour?.documents ?? []
  const prev = () => setCurrent((c) => Math.max(0, c - 1))
  const next = () => setCurrent((c) => Math.min(docs.length - 1, c + 1))

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0]?.clientX ?? null }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    if (Math.abs(dx) > 50) { if (dx < 0) next(); else prev() }
    touchStartX.current = null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!tour) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar title="ตั๋วเข้าสถานที่" subtitle={tour.title}>
        {docs.length > 0 && (
          <span className="text-sm text-white/60 mr-1">{current + 1} / {docs.length}</span>
        )}
      </TopBar>

      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <span className="text-6xl mb-4">🎫</span>
          <p className="text-lg font-medium">ยังไม่มีตั๋ว</p>
          <p className="text-sm mt-1">ผู้จัดทัวร์จะเพิ่มตั๋วก่อนเดินทาง</p>
        </div>
      ) : (
        <>
          <div className="relative px-6 pt-8 pb-4">
            {docs.length > 1 && current < docs.length - 1 && (
              <div className="absolute inset-x-10 top-10 rounded-3xl bg-white/60 shadow-lg" style={{ height: 430 }} />
            )}
            {docs.length > 2 && current < docs.length - 2 && (
              <div className="absolute inset-x-14 top-12 rounded-3xl bg-white/40 shadow" style={{ height: 430 }} />
            )}
            <div ref={containerRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="relative z-10 select-none">
              {docs[current] && <TicketCard doc={docs[current]!} active={true} />}
            </div>
          </div>

          <div className="flex justify-center gap-2 py-2">
            {docs.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? 'w-6 h-2 bg-indigo-600' : 'w-2 h-2 bg-gray-300'}`}
              />
            ))}
          </div>

          {docs.length > 1 && <p className="text-center text-xs text-gray-400 mt-1">ปัดซ้าย-ขวาเพื่อดูตั๋วอื่น</p>}

          {docs.length > 1 && (
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={prev} disabled={current === 0}
                className="px-6 py-2 rounded-xl bg-white shadow text-gray-700 disabled:opacity-30 text-sm font-medium">
                ← ก่อนหน้า
              </button>
              <button onClick={next} disabled={current === docs.length - 1}
                className="px-6 py-2 rounded-xl bg-white shadow text-gray-700 disabled:opacity-30 text-sm font-medium">
                ถัดไป →
              </button>
            </div>
          )}

          <div className="px-4 mt-6 mb-8">
            <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">ทั้งหมด ({docs.length} ใบ)</p>
            <div className="flex flex-wrap gap-2">
              {docs.map((doc, i) => {
                const cfg = (typeConfig[doc.type] ?? typeConfig['OTHER'])!
                return (
                  <button
                    key={doc.id}
                    onClick={() => setCurrent(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      i === current ? `${cfg.badgeColor} text-white shadow-md scale-105` : 'bg-white text-gray-600 shadow-sm'
                    }`}
                  >
                    <span>{cfg.emoji}</span>
                    <span>{doc.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      <BottomNav activeTab="documents" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}
