'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
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
  userId: string | null
}

interface TourBasic {
  id: string
  title: string
  isChina: boolean
}

// ── Type config with hex colors ──
const typeColors: Record<string, string> = {
  FLIGHT_TICKET: '#3b82f6', HOTEL_VOUCHER: '#8b5cf6', TOUR_VOUCHER: '#22c55e',
  VISA: '#ef4444', QR_CODE: '#6b7280', INSURANCE: '#14b8a6',
  PASSPORT: '#6366f1', MAP: '#f59e0b', VISIT_JAPAN_WEB: '#ef4444',
  CHINA_HEALTH_KIT: '#ef4444', OTHER: '#94a3b8',
}
const typeLabels: Record<string, string> = {
  FLIGHT_TICKET: 'ตั๋วเครื่องบิน', HOTEL_VOUCHER: 'เวาเชอร์โรงแรม',
  TOUR_VOUCHER: 'เวาเชอร์ทัวร์', VISA: 'วีซ่า', QR_CODE: 'QR Code',
  INSURANCE: 'ประกันเดินทาง', PASSPORT: 'พาสปอร์ต', MAP: 'แผนที่',
  VISIT_JAPAN_WEB: 'Visit Japan Web', CHINA_HEALTH_KIT: 'China Health Kit',
  OTHER: 'เอกสารอื่น',
}

function rgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

const typeIcons: Record<string, React.ReactNode> = {
  FLIGHT_TICKET: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  HOTEL_VOUCHER: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  VISA: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
    </svg>
  ),
  INSURANCE: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  OTHER: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
}

function getIcon(type: string) {
  return typeIcons[type] ?? typeIcons['OTHER']
}

const docTypeOptions = [
  { value: 'FLIGHT_TICKET', label: 'ตั๋วเครื่องบิน' },
  { value: 'HOTEL_VOUCHER', label: 'เวาเชอร์โรงแรม' },
  { value: 'TOUR_VOUCHER', label: 'เวาเชอร์ทัวร์' },
  { value: 'VISA', label: 'วีซ่า' },
  { value: 'INSURANCE', label: 'ประกันเดินทาง' },
  { value: 'OTHER', label: 'อื่นๆ' },
]

function isPdf(url: string | null): boolean {
  return !!url && url.toLowerCase().endsWith('.pdf')
}

// ── Glass tokens ──
const glassStyle = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.88)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 20px rgba(0,0,0,0.05)',
} as const

function QRCanvas({ data }: { data: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current) {
      import('qrcode').then(QRCode => {
        QRCode.default.toCanvas(ref.current!, data, {
          width: 200, margin: 1,
          color: { dark: '#1a1a2e', light: '#f8f8fc' },
        })
      })
    }
  }, [data])
  return <canvas ref={ref} className="rounded-xl" />
}

function DocumentModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const hex = typeColors[doc.type] ?? typeColors['OTHER']!
  const label = typeLabels[doc.type] ?? typeLabels['OTHER']!
  const hasFile = !!doc.fileUrl
  const hasQr = !!doc.qrData
  const fileIsPdf = hasFile && isPdf(doc.fileUrl)
  const fileIsImage = hasFile && !fileIsPdf

  return (
    <div className="fixed inset-0 z-[100]">
      <style>{`
        @keyframes modalBdIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalBdOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.94) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes sheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(15,10,30,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'modalBdIn 0.2s ease both',
        }}
        onClick={onClose}
      />

      {/* Desktop: centered modal / Mobile: bottom sheet */}
      {/* Centered modal (>=640px) */}
      <div className="fixed inset-0 hidden min-[640px]:flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-[92vw] max-w-[480px] pointer-events-auto rounded-[24px] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 24px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)',
            animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <ModalContent doc={doc} hex={hex} label={label} hasFile={hasFile} hasQr={hasQr} fileIsPdf={fileIsPdf} fileIsImage={fileIsImage} onClose={onClose} />
        </div>
      </div>

      {/* Bottom sheet (<640px) */}
      <div className="fixed inset-x-0 bottom-0 min-[640px]:hidden pointer-events-auto" style={{ maxHeight: '90vh' }}>
        <div
          className="rounded-t-[24px] overflow-hidden overflow-y-auto"
          style={{
            maxHeight: '90vh',
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.9)',
            borderBottom: 'none',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 -8px 40px rgba(0,0,0,0.12)',
            animation: 'sheetIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-9 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
          </div>
          <ModalContent doc={doc} hex={hex} label={label} hasFile={hasFile} hasQr={hasQr} fileIsPdf={fileIsPdf} fileIsImage={fileIsImage} onClose={onClose} />
        </div>
      </div>
    </div>
  )
}

function ModalContent({ doc, hex, label, hasFile, hasQr, fileIsPdf, fileIsImage, onClose }: {
  doc: Document; hex: string; label: string
  hasFile: boolean; hasQr: boolean; fileIsPdf: boolean; fileIsImage: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3" style={{ padding: '18px 20px 14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: rgba(hex, 0.1), color: hex }}>
          {getIcon(doc.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-[#1a1a2e] truncate">{doc.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center h-5 px-2 rounded-[10px] text-[11px] font-semibold" style={{ background: rgba(hex, 0.1), border: `1px solid ${rgba(hex, 0.2)}`, color: hex }}>{label}</span>
            {fileIsPdf && <span className="inline-flex items-center h-5 px-2 rounded-[10px] text-[11px] font-semibold" style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(30,30,60,0.5)' }}>PDF</span>}
            {doc.isPersonal && <span className="inline-flex items-center h-5 px-2 rounded-[10px] text-[11px] font-semibold" style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.2)', color: '#7c5cfc' }}>ส่วนตัว</span>}
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 no-btn-fx transition-colors" style={{ background: 'rgba(0,0,0,0.06)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }}>
          <span className="text-[14px] text-[rgba(30,30,60,0.4)]">✕</span>
        </button>
      </div>

      {/* Preview area */}
      <div style={{ background: 'rgba(0,0,0,0.02)' }}>
        {fileIsImage && (
          <div className="flex items-center justify-center p-5 min-h-[200px]">
            <img src={doc.fileUrl!} alt={doc.title} className="max-w-full max-h-[50vh] object-contain rounded-2xl" style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
          </div>
        )}
        {fileIsPdf && (
          <iframe src={`${doc.fileUrl}#toolbar=0&navpanes=0`} className="w-full border-0" style={{ height: '50vh' }} title={doc.title} />
        )}
        {hasQr && !hasFile && (
          <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
            <div className="rounded-2xl p-4" style={{ background: '#f8f8fc', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <QRCanvas data={doc.qrData!} />
            </div>
            <p className="text-xs text-[rgba(30,30,60,0.4)] mt-3">แสดง QR Code นี้ที่จุดตรวจ</p>
          </div>
        )}
        {!hasFile && !hasQr && (
          <div className="flex flex-col items-center justify-center p-12 min-h-[140px]">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: rgba(hex, 0.1), border: `1px solid ${rgba(hex, 0.2)}`, color: hex }}>
              <div className="scale-125">{getIcon(doc.type)}</div>
            </div>
            <p className="text-sm text-[rgba(30,30,60,0.4)]">ยังไม่มีไฟล์แนบ</p>
          </div>
        )}
      </div>

      {/* Footer — info + action */}
      <div style={{ padding: '14px 20px 20px 20px', borderTop: '0.5px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.5)' }}>
        {(doc.titleEn || doc.description) && (
          <div className="mb-3.5">
            {doc.titleEn && <p className="text-[12px] text-[rgba(30,30,60,0.4)]">{doc.titleEn}</p>}
            {doc.description && <p className="text-[13px] text-[rgba(30,30,60,0.5)] leading-relaxed mt-1">{doc.description}</p>}
          </div>
        )}

        {hasFile && (
          <a
            href={doc.fileUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2.5 w-full h-[52px] rounded-[14px] text-[15px] font-semibold text-[#3d3a5c] no-btn-fx transition-all duration-[180ms] hover:-translate-y-px active:scale-[0.98]"
            style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 12px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(124,92,252,0.06)'
              e.currentTarget.style.borderColor = 'rgba(124,92,252,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.7)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)'
            }}
          >
            <svg className="w-[18px] h-[18px] text-[#7c5cfc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            เปิดไฟล์เต็มจอ
          </a>
        )}
      </div>
    </>
  )
}

function DocRow({ doc, onClick, onDelete }: { doc: Document; onClick: () => void; onDelete?: () => void }) {
  const hex = typeColors[doc.type] ?? typeColors['OTHER']!
  const label = typeLabels[doc.type] ?? typeLabels['OTHER']!

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer transition-colors duration-150 hover:bg-[rgba(255,255,255,0.5)]"
      style={{ padding: '14px 16px' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: rgba(hex, 0.1), color: hex }}>
        {getIcon(doc.type)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#1a1a2e] truncate whitespace-nowrap">{doc.title}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="inline-flex items-center h-5 px-2 rounded-[10px] text-[11px] font-semibold" style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(30,30,60,0.5)' }}>
            {label}
          </span>
          {doc.fileUrl && isPdf(doc.fileUrl) && (
            <span className="inline-flex items-center h-5 px-2 rounded-[10px] text-[11px] font-semibold" style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(30,30,60,0.5)' }}>
              PDF
            </span>
          )}
          {doc.isPersonal && (
            <span className="inline-flex items-center h-5 px-2 rounded-[10px] text-[11px] font-semibold" style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.2)', color: '#7c5cfc' }}>
              ส่วนตัว
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors no-btn-fx"
            style={{ color: 'rgba(0,0,0,0.2)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(0,0,0,0.2)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        )}
        <svg className="w-3.5 h-3.5" style={{ color: 'rgba(0,0,0,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  const params = useParams()
  const tourId = params.id as string
  const [tour, setTour] = useState<TourBasic | null>(null)
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState('FLIGHT_TICKET')
  const [formFileUrl, setFormFileUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/tours/${tourId}`).then(r => r.json()),
      fetch(`/api/tours/${tourId}/documents`).then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()).catch(() => null),
    ]).then(([tourData, docsData, userData]) => {
      setTour(tourData)
      setDocs(Array.isArray(docsData) ? docsData : tourData.documents ?? [])
      setUserId(userData?.id ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [tourId])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setFormFileUrl(data.url)
        if (!formTitle) setFormTitle(file.name.replace(/\.[^.]+$/, ''))
      }
    } finally {
      setUploading(false)
    }
  }

  async function addDocument() {
    if (!formTitle.trim() || !formFileUrl) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tours/${tourId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle.trim(), type: formType, fileUrl: formFileUrl }),
      })
      if (res.ok) {
        const doc = await res.json() as Document
        setDocs(prev => [...prev, doc])
        setFormTitle(''); setFormType('FLIGHT_TICKET'); setFormFileUrl(''); setAdding(false)
      }
    } finally { setSaving(false) }
  }

  async function deleteDoc(docId: string) {
    const res = await fetch(`/api/tours/${tourId}/documents/${docId}`, { method: 'DELETE' })
    if (res.ok) { setDocs(prev => prev.filter(d => d.id !== docId)); setSelectedDoc(null) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7c5cfc] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!tour) return null

  const groupDocs = docs.filter(d => !d.isPersonal)
  const myDocs = docs.filter(d => d.isPersonal && d.userId === userId)

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[rgba(124,92,252,0.3)] transition-colors'

  return (
    <div className="min-h-screen bg-[#f0f2f8] relative overflow-hidden" style={{ paddingBottom: '100px' }}>
      <style>{`
        @keyframes docCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #ede9f6 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #e8eaf2 0%, transparent 70%)' }} />
      </div>

      <TopBar title="ตั๋ว / เอกสาร" subtitle={tour.title} />

      <div className="relative z-10 px-4 pt-4 max-w-[680px] mx-auto space-y-5">
        {/* ═══ GROUP DOCUMENTS ═══ */}
        {groupDocs.length > 0 && (
          <div style={{ animation: 'docCardIn 0.3s ease-out 0ms both' }}>
            <div className="flex items-center gap-2 mb-2 pl-1">
              <p className="text-[11px] font-bold uppercase text-[rgba(30,30,60,0.4)]" style={{ letterSpacing: '0.09em' }}>ตั๋วจากผู้จัดทัวร์</p>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-[20px]" style={{ background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', color: '#7c5cfc' }}>{groupDocs.length}</span>
            </div>
            <div className="rounded-[20px] overflow-hidden" style={glassStyle}>
              {groupDocs.map((doc, i) => (
                <div key={doc.id}>
                  {i > 0 && <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.05)', marginLeft: '68px' }} />}
                  <DocRow doc={doc} onClick={() => setSelectedDoc(doc)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ MY DOCUMENTS ═══ */}
        <div style={{ animation: 'docCardIn 0.3s ease-out 80ms both' }}>
          <div className="flex items-center gap-2 mb-2 pl-1">
            <p className="text-[11px] font-bold uppercase text-[rgba(30,30,60,0.4)]" style={{ letterSpacing: '0.09em' }}>ตั๋วของฉัน</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-[20px]" style={{ background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', color: '#7c5cfc' }}>{myDocs.length}</span>
          </div>

          {myDocs.length > 0 && (
            <div className="rounded-[20px] overflow-hidden mb-3" style={glassStyle}>
              {myDocs.map((doc, i) => (
                <div key={doc.id}>
                  {i > 0 && <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.05)', marginLeft: '68px' }} />}
                  <DocRow doc={doc} onClick={() => setSelectedDoc(doc)} onDelete={() => deleteDoc(doc.id)} />
                </div>
              ))}
            </div>
          )}

          {/* Add ticket form */}
          {adding ? (
            <div className="rounded-[20px] p-5 space-y-3" style={glassStyle}>
              <h3 className="text-sm font-semibold text-[#1a1a2e]">เพิ่มตั๋วของฉัน</h3>

              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileUpload} className="hidden" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-8 rounded-2xl flex flex-col items-center gap-2 active:scale-[0.99] transition-all no-btn-fx"
                style={{ border: '1.5px dashed rgba(124,92,252,0.3)', background: 'rgba(255,255,255,0.4)' }}
              >
                {uploading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-[#7c5cfc] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-[rgba(30,30,60,0.5)]">กำลังอัพโหลด...</span>
                  </>
                ) : formFileUrl ? (
                  <>
                    <svg className="w-7 h-7 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-[#22c55e] font-medium">อัพโหลดแล้ว — กดเพื่อเปลี่ยน</span>
                  </>
                ) : (
                  <>
                    <svg className="w-7 h-7 text-[#7c5cfc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm text-[rgba(30,30,60,0.4)]">เลือกไฟล์ PDF หรือรูปภาพ</span>
                  </>
                )}
              </button>

              <div>
                <label className="text-[11px] text-[rgba(30,30,60,0.4)] font-bold mb-1 block uppercase" style={{ letterSpacing: '0.06em' }}>ชื่อตั๋ว</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                  className={inputCls} placeholder="เช่น ตั๋วเครื่องบิน TG676"
                  style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }} />
              </div>

              <div>
                <label className="text-[11px] text-[rgba(30,30,60,0.4)] font-bold mb-1 block uppercase" style={{ letterSpacing: '0.06em' }}>ประเภท</label>
                <select value={formType} onChange={e => setFormType(e.target.value)}
                  className={inputCls} style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  {docTypeOptions.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={addDocument} disabled={saving || !formTitle.trim() || !formFileUrl}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#f8f8fc] disabled:opacity-40 active:scale-[0.98] transition-all no-btn-fx"
                  style={{ background: 'linear-gradient(to right, #7c5cfc, #4fc3f7)', boxShadow: '0 4px 16px rgba(124,92,252,0.25)' }}>
                  {saving ? 'กำลังบันทึก...' : 'เพิ่มตั๋ว'}
                </button>
                <button onClick={() => { setAdding(false); setFormTitle(''); setFormFileUrl('') }}
                  className="px-4 py-2.5 rounded-xl text-sm text-[rgba(30,30,60,0.5)] transition-all no-btn-fx"
                  style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center h-[52px] rounded-2xl text-[14px] font-semibold no-btn-fx transition-all duration-200 hover:-translate-y-px"
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1.5px dashed rgba(124,92,252,0.3)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                color: '#7c5cfc',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(124,92,252,0.6)'; e.currentTarget.style.background = 'rgba(124,92,252,0.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(124,92,252,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.55)' }}
            >
              + เพิ่มตั๋วของฉัน
            </button>
          )}
        </div>

        {/* Empty state */}
        {docs.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-16 rounded-[20px]" style={{ ...glassStyle, animation: 'docCardIn 0.3s ease-out 150ms both' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.15)' }}>
              <svg className="w-7 h-7 text-[#7c5cfc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-[#1a1a2e]">ยังไม่มีตั๋ว</p>
            <p className="text-sm text-[rgba(30,30,60,0.4)] mt-1">ผู้จัดทัวร์จะเพิ่มตั๋วก่อนเดินทาง</p>
            <p className="text-sm text-[rgba(30,30,60,0.4)] mt-0.5">หรือคุณสามารถเพิ่มตั๋วส่วนตัวได้เอง</p>
          </div>
        )}
      </div>

      {selectedDoc && <DocumentModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}

      <BottomNav activeTab="documents" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}
