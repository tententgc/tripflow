'use client'

import { useState, useRef } from 'react'

interface DocItem {
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

const docTypes = [
  { value: 'FLIGHT_TICKET',    label: 'ตั๋วเครื่องบิน',  emoji: '✈️' },
  { value: 'HOTEL_VOUCHER',    label: 'เวาเชอร์โรงแรม',  emoji: '🏨' },
  { value: 'TOUR_VOUCHER',     label: 'เวาเชอร์ทัวร์',    emoji: '🗺️' },
  { value: 'VISA',             label: 'วีซ่า',             emoji: '📋' },
  { value: 'QR_CODE',          label: 'QR Code',           emoji: '⬛' },
  { value: 'INSURANCE',        label: 'ประกันเดินทาง',     emoji: '🛡️' },
  { value: 'PASSPORT',         label: 'พาสปอร์ต',          emoji: '📘' },
  { value: 'MAP',              label: 'แผนที่',             emoji: '🗺️' },
  { value: 'VISIT_JAPAN_WEB',  label: 'Visit Japan Web',   emoji: '🇯🇵' },
  { value: 'CHINA_HEALTH_KIT', label: 'China Health Kit',  emoji: '🇨🇳' },
  { value: 'OTHER',            label: 'อื่นๆ',             emoji: '📄' },
]

const typeLabels: Record<string, { label: string; emoji: string }> = Object.fromEntries(
  docTypes.map(t => [t.value, { label: t.label, emoji: t.emoji }])
)

type FormState = {
  title: string
  titleEn: string
  type: string
  description: string
  qrData: string
  fileUrl: string
}

const emptyForm: FormState = {
  title: '',
  titleEn: '',
  type: 'FLIGHT_TICKET',
  description: '',
  qrData: '',
  fileUrl: '',
}

export default function DocumentsManager({
  tourId,
  initialDocuments,
}: {
  tourId: string
  initialDocuments: DocItem[]
}) {
  const [docs, setDocs] = useState<DocItem[]>(initialDocuments)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File): Promise<string | null> {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) return null
      const data = await res.json()
      return data.url as string
    } finally {
      setUploading(false)
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFile(file)
    if (url) {
      setForm(p => ({ ...p, fileUrl: url }))
    }
  }

  async function addDocument() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tours/${tourId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          titleEn: form.titleEn.trim() || null,
          type: form.type,
          description: form.description.trim() || null,
          qrData: form.qrData.trim() || null,
          fileUrl: form.fileUrl.trim() || null,
        }),
      })
      if (res.ok) {
        const doc = await res.json() as DocItem
        setDocs(prev => [...prev, doc])
        setForm(emptyForm)
        setAdding(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteDoc(docId: string) {
    if (!confirm('ลบเอกสารนี้?')) return
    const res = await fetch(`/api/tours/${tourId}/documents/${docId}`, { method: 'DELETE' })
    if (res.ok) setDocs(prev => prev.filter(d => d.id !== docId))
  }

  const inputCls = 'px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'

  function isPdf(url: string | null): boolean {
    return !!url && url.toLowerCase().endsWith('.pdf')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">เอกสาร / ตั๋ว ({docs.length})</h2>
      </div>

      {docs.length === 0 && !adding && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <p className="text-3xl mb-2">🎫</p>
          <p className="text-gray-600 font-medium">ยังไม่มีเอกสาร</p>
          <p className="text-gray-400 text-sm mt-1">เพิ่มตั๋ว เวาเชอร์ หรือเอกสารสำหรับทัวร์นี้</p>
        </div>
      )}

      {docs.map(doc => {
        const cfg = typeLabels[doc.type] ?? typeLabels['OTHER']!
        return (
          <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <span className="text-2xl">{cfg.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full flex-shrink-0">{cfg.label}</span>
                </div>
                {doc.titleEn && <p className="text-xs text-gray-400 truncate">{doc.titleEn}</p>}
                {doc.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.description}</p>}
                <div className="flex gap-2 mt-1">
                  {doc.fileUrl && (
                    <span className="text-[10px] text-blue-600">
                      {isPdf(doc.fileUrl) ? '📄 PDF' : '📎 ไฟล์แนบ'}
                    </span>
                  )}
                  {doc.qrData && <span className="text-[10px] text-gray-500">⬛ QR</span>}
                  {doc.isPersonal && <span className="text-[10px] text-orange-500">👤 ส่วนตัว</span>}
                </div>
              </div>

              {/* PDF preview thumbnail */}
              {doc.fileUrl && isPdf(doc.fileUrl) && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-20 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 hover:border-blue-300 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl">📄</span>
                    <p className="text-[8px] text-gray-400 mt-0.5">PDF</p>
                  </div>
                </a>
              )}

              {doc.fileUrl && !isPdf(doc.fileUrl) && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-20 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 hover:border-blue-300 transition-colors"
                >
                  <img src={doc.fileUrl} alt="" className="w-full h-full object-cover" />
                </a>
              )}

              <button
                onClick={() => deleteDoc(doc.id)}
                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                🗑️
              </button>
            </div>
          </div>
        )
      })}

      {/* Add document form */}
      {adding ? (
        <div className="bg-amber-50 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-0.5 block">ชื่อเอกสาร</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className={`w-full ${inputCls}`}
                placeholder="เช่น ตั๋วเครื่องบิน TG676"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-0.5 block">ชื่อ EN</label>
              <input
                type="text"
                value={form.titleEn}
                onChange={e => setForm(p => ({ ...p, titleEn: e.target.value }))}
                className={`w-full ${inputCls}`}
                placeholder="Flight Ticket TG676"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-0.5 block">ประเภท</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className={`w-full ${inputCls}`}
              >
                {docTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">รายละเอียด</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className={`w-full ${inputCls}`}
              placeholder="Thai Airways BKK → NRT 18 เม.ย. 2569"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">อัพโหลดไฟล์ (PDF / รูปภาพ)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="px-3 py-2 border border-dashed border-gray-300 bg-white rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex-1"
              >
                {uploading ? 'กำลังอัพโหลด...' : form.fileUrl ? '📎 เปลี่ยนไฟล์' : '📎 เลือกไฟล์'}
              </button>
              {form.fileUrl && (
                <span className="self-center text-xs text-green-600">อัพโหลดแล้ว</span>
              )}
            </div>
          </div>

          {/* QR data (optional) */}
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">QR Code data (ถ้ามี)</label>
            <input
              type="text"
              value={form.qrData}
              onChange={e => setForm(p => ({ ...p, qrData: e.target.value }))}
              className={`w-full ${inputCls}`}
              placeholder="ข้อมูล QR Code"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={addDocument}
              disabled={saving || !form.title.trim()}
              className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'เพิ่มเอกสาร'}
            </button>
            <button
              onClick={() => { setAdding(false); setForm(emptyForm) }}
              className="px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-lg text-sm"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-xl text-sm hover:border-amber-400 hover:text-amber-600 transition-colors"
        >
          + เพิ่มเอกสาร / ตั๋ว
        </button>
      )}
    </div>
  )
}
