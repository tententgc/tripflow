'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
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
  userId: string | null
}

interface TourBasic {
  id: string
  title: string
  isChina: boolean
}

const typeConfig: Record<string, { label: string; emoji: string; gradient: string; badgeColor: string }> = {
  FLIGHT_TICKET:    { label: 'ตั๋วเครื่องบิน',    emoji: '✈️', gradient: 'from-blue-600 to-blue-800',     badgeColor: 'bg-blue-500' },
  HOTEL_VOUCHER:    { label: 'เวาเชอร์โรงแรม',    emoji: '🏨', gradient: 'from-violet-600 to-purple-800', badgeColor: 'bg-violet-500' },
  TOUR_VOUCHER:     { label: 'เวาเชอร์ทัวร์',      emoji: '🗺️', gradient: 'from-green-600 to-green-800',   badgeColor: 'bg-green-500' },
  VISA:             { label: 'วีซ่า',               emoji: '📋', gradient: 'from-red-600 to-red-800',       badgeColor: 'bg-red-500' },
  QR_CODE:          { label: 'QR Code',             emoji: '⬛', gradient: 'from-gray-700 to-gray-900',     badgeColor: 'bg-gray-600' },
  INSURANCE:        { label: 'ประกันเดินทาง',       emoji: '🛡️', gradient: 'from-teal-600 to-teal-800',    badgeColor: 'bg-teal-500' },
  PASSPORT:         { label: 'พาสปอร์ต',            emoji: '📘', gradient: 'from-indigo-600 to-violet-700', badgeColor: 'bg-indigo-500' },
  MAP:              { label: 'แผนที่',               emoji: '🗺️', gradient: 'from-amber-600 to-amber-800',  badgeColor: 'bg-amber-500' },
  VISIT_JAPAN_WEB:  { label: 'Visit Japan Web',     emoji: '🇯🇵', gradient: 'from-rose-600 to-rose-800',    badgeColor: 'bg-rose-500' },
  CHINA_HEALTH_KIT: { label: 'China Health Kit',    emoji: '🇨🇳', gradient: 'from-red-700 to-red-900',     badgeColor: 'bg-red-600' },
  OTHER:            { label: 'เอกสารอื่น',           emoji: '📄', gradient: 'from-slate-600 to-slate-800',  badgeColor: 'bg-slate-500' },
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
      QRCode.toCanvas(ref.current, data, {
        width: 200, margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
    }
  }, [data])
  return <canvas ref={ref} className="rounded-xl shadow-md" />
}

function DocumentDetail({ doc, onBack }: { doc: Document; onBack: () => void }) {
  const cfg = typeConfig[doc.type] ?? typeConfig['OTHER']!

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-br ${cfg.gradient} p-5 pb-6`}>
        <button onClick={onBack} className="text-white/70 text-sm mb-3 active:text-white">
          ← กลับ
        </button>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
              {cfg.label}
            </span>
            <h2 className="text-xl font-bold text-white mt-1">{doc.title}</h2>
            {doc.titleEn && <p className="text-sm text-white/70 mt-0.5">{doc.titleEn}</p>}
          </div>
          <span className="text-4xl">{cfg.emoji}</span>
        </div>
        {doc.description && <p className="text-sm text-white/80 mt-2">{doc.description}</p>}
        {doc.isPersonal && (
          <span className="inline-block mt-2 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
            ตั๋วส่วนตัว
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 -mt-2">
        {/* PDF viewer */}
        {doc.fileUrl && isPdf(doc.fileUrl) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <iframe
              src={`${doc.fileUrl}#toolbar=0&navpanes=0`}
              className="w-full border-0"
              style={{ height: '70vh' }}
              title={doc.title}
            />
          </div>
        )}

        {/* Image viewer */}
        {doc.fileUrl && !isPdf(doc.fileUrl) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-3 flex flex-col items-center">
            <QRCanvas data={doc.qrData} />
            <p className="text-xs text-gray-400 mt-3 text-center">แสดง QR Code นี้ที่จุดตรวจ</p>
          </div>
        )}

        {/* No content */}
        {!doc.fileUrl && !doc.qrData && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <span className="text-5xl">📄</span>
            <p className="text-sm text-gray-400 mt-3">ยังไม่มีไฟล์แนบ</p>
          </div>
        )}

        {/* Open in new tab button for files */}
        {doc.fileUrl && (
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 py-3 bg-white rounded-2xl text-center text-sm text-indigo-600 font-medium border border-gray-100 shadow-sm active:bg-indigo-50"
          >
            เปิดไฟล์เต็มจอ
          </a>
        )}
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  // Group docs = shared for everyone (not personal)
  const groupDocs = docs.filter(d => !d.isPersonal)
  // My docs = personal tickets assigned to me (by admin or self-uploaded)
  const myDocs = docs.filter(d => d.isPersonal && d.userId === userId)

  const inputCls = 'w-full px-3 py-2 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="ตั๋ว / เอกสาร" subtitle={tour.title} />

      <div className="px-4 -mt-2 space-y-4">
        {/* Group documents (from admin) */}
        {groupDocs.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
              ตั๋วจากผู้จัดทัวร์ ({groupDocs.length})
            </p>
            <div className="space-y-2">
              {groupDocs.map(doc => {
                const cfg = typeConfig[doc.type] ?? typeConfig['OTHER']!
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 text-left active:bg-gray-50 transition-colors"
                    style={{ minHeight: '64px' }}
                  >
                    {/* Thumbnail */}
                    {doc.fileUrl && isPdf(doc.fileUrl) ? (
                      <div className={`w-12 h-14 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-lg">{cfg.emoji}</span>
                      </div>
                    ) : doc.fileUrl ? (
                      <div className="w-12 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                        <img src={doc.fileUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-12 h-14 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-lg">{cfg.emoji}</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 ${cfg.badgeColor} text-white rounded-full`}>
                          {cfg.label}
                        </span>
                        {doc.fileUrl && isPdf(doc.fileUrl) && (
                          <span className="text-[10px] text-gray-400">PDF</span>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.description}</p>
                      )}
                    </div>
                    <span className="text-gray-300 text-lg flex-shrink-0">›</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* My personal documents */}
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
            ตั๋วของฉัน ({myDocs.length})
          </p>

          {myDocs.length > 0 && (
            <div className="space-y-2 mb-3">
              {myDocs.map(doc => {
                const cfg = typeConfig[doc.type] ?? typeConfig['OTHER']!
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <div className="p-4 flex items-center gap-3" style={{ minHeight: '64px' }}>
                      {doc.fileUrl && isPdf(doc.fileUrl) ? (
                        <div className={`w-12 h-14 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-lg">{cfg.emoji}</span>
                        </div>
                      ) : doc.fileUrl ? (
                        <div className="w-12 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                          <img src={doc.fileUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-12 h-14 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-lg">{cfg.emoji}</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 ${cfg.badgeColor} text-white rounded-full`}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-orange-500">ส่วนตัว</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id) }}
                        className="text-gray-300 hover:text-red-500 flex-shrink-0 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add ticket form */}
          {adding ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
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
                className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center gap-2 active:bg-gray-50 transition-colors"
              >
                {uploading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">กำลังอัพโหลด...</span>
                  </>
                ) : formFileUrl ? (
                  <>
                    <span className="text-3xl">{isPdf(formFileUrl) ? '📄' : '🖼️'}</span>
                    <span className="text-sm text-green-600 font-medium">อัพโหลดแล้ว — กดเพื่อเปลี่ยน</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">📎</span>
                    <span className="text-sm text-gray-500">เลือกไฟล์ PDF หรือรูปภาพ</span>
                  </>
                )}
              </button>

              <div>
                <label className="text-xs text-gray-500 mb-0.5 block">ชื่อตั๋ว</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className={inputCls}
                  placeholder="เช่น ตั๋วเครื่องบิน TG676"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-0.5 block">ประเภท</label>
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
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'กำลังบันทึก...' : 'เพิ่มตั๋ว'}
                </button>
                <button
                  onClick={() => { setAdding(false); setFormTitle(''); setFormFileUrl('') }}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full py-3 bg-white border-2 border-dashed border-gray-200 text-gray-500 rounded-2xl text-sm font-medium active:bg-gray-50 transition-colors"
            >
              + เพิ่มตั๋วของฉัน
            </button>
          )}
        </div>

        {/* Empty state */}
        {docs.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-6xl mb-4">🎫</span>
            <p className="text-lg font-medium">ยังไม่มีตั๋ว</p>
            <p className="text-sm mt-1">ผู้จัดทัวร์จะเพิ่มตั๋วก่อนเดินทาง</p>
            <p className="text-sm mt-0.5">หรือคุณสามารถเพิ่มตั๋วส่วนตัวได้เอง</p>
          </div>
        )}
      </div>

      <BottomNav activeTab="documents" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}
