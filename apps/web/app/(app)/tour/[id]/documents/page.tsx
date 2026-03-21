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

const typeConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  FLIGHT_TICKET:    { label: 'ตั๋วเครื่องบิน',    color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
  HOTEL_VOUCHER:    { label: 'เวาเชอร์โรงแรม',    color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-100' },
  TOUR_VOUCHER:     { label: 'เวาเชอร์ทัวร์',      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  VISA:             { label: 'วีซ่า',               color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100' },
  QR_CODE:          { label: 'QR Code',             color: 'text-gray-600',    bg: 'bg-gray-50',    border: 'border-gray-200' },
  INSURANCE:        { label: 'ประกันเดินทาง',       color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-100' },
  PASSPORT:         { label: 'พาสปอร์ต',            color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100' },
  MAP:              { label: 'แผนที่',               color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100' },
  VISIT_JAPAN_WEB:  { label: 'Visit Japan Web',     color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100' },
  CHINA_HEALTH_KIT: { label: 'China Health Kit',    color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-100' },
  OTHER:            { label: 'เอกสารอื่น',           color: 'text-gray-500',    bg: 'bg-gray-50',    border: 'border-gray-200' },
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
  { value: 'FLIGHT_TICKET',  label: 'ตั๋วเครื่องบิน' },
  { value: 'HOTEL_VOUCHER',  label: 'เวาเชอร์โรงแรม' },
  { value: 'TOUR_VOUCHER',   label: 'เวาเชอร์ทัวร์' },
  { value: 'VISA',           label: 'วีซ่า' },
  { value: 'INSURANCE',      label: 'ประกันเดินทาง' },
  { value: 'OTHER',          label: 'อื่นๆ' },
]

function isPdf(url: string | null): boolean {
  return !!url && url.toLowerCase().endsWith('.pdf')
}

function QRCanvas({ data }: { data: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current) {
      import('qrcode').then(QRCode => {
        QRCode.default.toCanvas(ref.current!, data, {
          width: 200, margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' },
        })
      })
    }
  }, [data])
  return <canvas ref={ref} className="rounded-xl" />
}

function DocumentDetail({ doc, onBack }: { doc: Document; onBack: () => void }) {
  const cfg = typeConfig[doc.type] ?? typeConfig['OTHER']!

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20">
      {/* Header — glass */}
      <div className="relative">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
        <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 pt-safe-top">
          <div className="py-4">
            <button onClick={onBack} className="text-indigo-600 text-sm mb-3 active:opacity-70 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              กลับ
            </button>
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${cfg.color}`}>
                  {cfg.label}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">{doc.title}</h2>
                {doc.titleEn && <p className="text-sm text-gray-400 mt-0.5">{doc.titleEn}</p>}
              </div>
              <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                {getIcon(doc.type)}
              </div>
            </div>
            {doc.description && <p className="text-sm text-gray-500 mt-2">{doc.description}</p>}
            {doc.isPersonal && (
              <span className="inline-block mt-2 text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-md font-medium">
                ตั๋วส่วนตัว
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 max-w-3xl mx-auto space-y-3">
        {/* PDF viewer */}
        {doc.fileUrl && isPdf(doc.fileUrl) && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden">
            <iframe
              src={`${doc.fileUrl}#toolbar=0&navpanes=0`}
              className="w-full border-0"
              style={{ height: 'min(70vh, 600px)' }}
              title={doc.title}
            />
          </div>
        )}

        {/* Image viewer */}
        {doc.fileUrl && !isPdf(doc.fileUrl) && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden">
            <img
              src={doc.fileUrl}
              alt={doc.title}
              className="w-full object-contain"
              style={{ maxHeight: '70vh' }}
            />
          </div>
        )}

        {/* QR Code */}
        {doc.qrData && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-6 flex flex-col items-center">
            <QRCanvas data={doc.qrData} />
            <p className="text-xs text-gray-400 mt-3 text-center">แสดง QR Code นี้ที่จุดตรวจ</p>
          </div>
        )}

        {/* No content */}
        {!doc.fileUrl && !doc.qrData && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100/60 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">ยังไม่มีไฟล์แนบ</p>
          </div>
        )}

        {/* Open in new tab */}
        {doc.fileUrl && (
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-3 bg-white/80 backdrop-blur-xl rounded-2xl text-center text-sm text-indigo-600 font-medium border border-indigo-100/40 active:bg-indigo-50/50 transition-colors"
          >
            เปิดไฟล์เต็มจอ
          </a>
        )}
      </div>
    </div>
  )
}

function DocCard({ doc, onClick, onDelete }: {
  doc: Document
  onClick: () => void
  onDelete?: () => void
}) {
  const cfg = typeConfig[doc.type] ?? typeConfig['OTHER']!

  return (
    <div
      onClick={onClick}
      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-4 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-all"
      style={{ minHeight: '64px' }}
    >
      {/* Thumbnail */}
      {doc.fileUrl && !isPdf(doc.fileUrl) ? (
        <div className="w-12 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-indigo-100/40">
          <img src={doc.fileUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`w-12 h-14 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
          {getIcon(doc.type)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[10px] px-1.5 py-0.5 ${cfg.bg} ${cfg.color} ${cfg.border} border rounded-md font-medium`}>
            {cfg.label}
          </span>
          {doc.fileUrl && isPdf(doc.fileUrl) && (
            <span className="text-[10px] text-gray-400">PDF</span>
          )}
          {doc.isPersonal && (
            <span className="text-[10px] text-indigo-500 font-medium">ส่วนตัว</span>
          )}
        </div>
        {doc.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.description}</p>
        )}
      </div>

      {onDelete ? (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-gray-300 hover:text-red-500 flex-shrink-0 p-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      ) : (
        <svg className="w-4 h-4 text-indigo-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      )}
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

  // Add ticket form
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
        body: JSON.stringify({
          title: formTitle.trim(),
          type: formType,
          fileUrl: formFileUrl,
        }),
      })
      if (res.ok) {
        const doc = await res.json() as Document
        setDocs(prev => [...prev, doc])
        setFormTitle('')
        setFormType('FLIGHT_TICKET')
        setFormFileUrl('')
        setAdding(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteDoc(docId: string) {
    const res = await fetch(`/api/tours/${tourId}/documents/${docId}`, { method: 'DELETE' })
    if (res.ok) {
      setDocs(prev => prev.filter(d => d.id !== docId))
      setSelectedDoc(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!tour) return null

  // Detail view
  if (selectedDoc) {
    return (
      <>
        <DocumentDetail doc={selectedDoc} onBack={() => setSelectedDoc(null)} />
        <div className="h-20" />
        <BottomNav activeTab="documents" tourId={tourId} isChina={tour.isChina} />
      </>
    )
  }

  const groupDocs = docs.filter(d => !d.isPersonal)
  const myDocs = docs.filter(d => d.isPersonal && d.userId === userId)

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200/80 bg-white/50 backdrop-blur-sm rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-colors'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20 pb-24">
      <TopBar title="ตั๋ว / เอกสาร" subtitle={tour.title} />

      <div className="px-4 pt-4 space-y-4 max-w-3xl mx-auto">
        {/* Group documents */}
        {groupDocs.length > 0 && (
          <div>
            <p className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider mb-2">
              ตั๋วจากผู้จัดทัวร์ ({groupDocs.length})
            </p>
            <div className="space-y-2">
              {groupDocs.map(doc => (
                <DocCard key={doc.id} doc={doc} onClick={() => setSelectedDoc(doc)} />
              ))}
            </div>
          </div>
        )}

        {/* My personal documents */}
        <div>
          <p className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider mb-2">
            ตั๋วของฉัน ({myDocs.length})
          </p>

          {myDocs.length > 0 && (
            <div className="space-y-2 mb-3">
              {myDocs.map(doc => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onClick={() => setSelectedDoc(doc)}
                  onDelete={() => deleteDoc(doc.id)}
                />
              ))}
            </div>
          )}

          {/* Add ticket form */}
          {adding ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">เพิ่มตั๋วของฉัน</h3>

              {/* File upload */}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-8 border-2 border-dashed border-indigo-200/50 rounded-xl flex flex-col items-center gap-2 active:bg-indigo-50/30 transition-colors"
              >
                {uploading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">กำลังอัพโหลด...</span>
                  </>
                ) : formFileUrl ? (
                  <>
                    <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-emerald-600 font-medium">อัพโหลดแล้ว — กดเพื่อเปลี่ยน</span>
                  </>
                ) : (
                  <>
                    <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm text-gray-500">เลือกไฟล์ PDF หรือรูปภาพ</span>
                  </>
                )}
              </button>

              <div>
                <label className="text-[11px] text-gray-400 font-medium mb-1 block">ชื่อตั๋ว</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className={inputCls}
                  placeholder="เช่น ตั๋วเครื่องบิน TG676"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-medium mb-1 block">ประเภท</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                  className={inputCls}
                >
                  {docTypeOptions.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addDocument}
                  disabled={saving || !formTitle.trim() || !formFileUrl}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {saving ? 'กำลังบันทึก...' : 'เพิ่มตั๋ว'}
                </button>
                <button
                  onClick={() => { setAdding(false); setFormTitle(''); setFormFileUrl('') }}
                  className="px-4 py-2.5 border border-gray-200/60 text-gray-500 rounded-xl text-sm bg-white/50 backdrop-blur-sm"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full py-3 bg-white/80 backdrop-blur-xl border-2 border-dashed border-indigo-200/40 text-indigo-500 rounded-2xl text-sm font-medium active:bg-indigo-50/50 transition-colors"
            >
              + เพิ่มตั๋วของฉัน
            </button>
          )}
        </div>

        {/* Empty state */}
        {docs.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-16 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100/60">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-700">ยังไม่มีตั๋ว</p>
            <p className="text-sm text-gray-400 mt-1">ผู้จัดทัวร์จะเพิ่มตั๋วก่อนเดินทาง</p>
            <p className="text-sm text-gray-400 mt-0.5">หรือคุณสามารถเพิ่มตั๋วส่วนตัวได้เอง</p>
          </div>
        )}
      </div>

      <BottomNav activeTab="documents" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}
