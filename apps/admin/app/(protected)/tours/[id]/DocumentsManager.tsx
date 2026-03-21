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

interface MemberInfo {
  userId: string
  name: string
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
  userId: string // '' = group, otherwise specific user
}

const emptyForm: FormState = {
  title: '',
  titleEn: '',
  type: 'FLIGHT_TICKET',
  description: '',
  qrData: '',
  fileUrl: '',
  userId: '',
}

export default function DocumentsManager({
  tourId,
  initialDocuments,
  members,
}: {
  tourId: string
  initialDocuments: DocItem[]
  members: MemberInfo[]
}) {
  const [docs, setDocs] = useState<DocItem[]>(initialDocuments)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  const memberMap = Object.fromEntries(members.map(m => [m.userId, m.name]))

  function startEdit(doc: DocItem) {
    setEditingId(doc.id)
    setForm({
      title: doc.title,
      titleEn: doc.titleEn ?? '',
      type: doc.type,
      description: doc.description ?? '',
      qrData: doc.qrData ?? '',
      fileUrl: doc.fileUrl ?? '',
      userId: doc.userId ?? '',
    })
    setAdding(false)
  }

  async function saveEdit() {
    if (!editingId || !form.title.trim()) return
    setSaving(true)
    try {
      const isPersonal = form.userId !== ''
      const res = await fetch(`/api/tours/${tourId}/documents/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          titleEn: form.titleEn.trim() || null,
          type: form.type,
          description: form.description.trim() || null,
          qrData: form.qrData.trim() || null,
          fileUrl: form.fileUrl.trim() || null,
          isPersonal,
          userId: isPersonal ? form.userId : null,
        }),
      })
      if (res.ok) {
        const updated = await res.json() as DocItem
        setDocs(prev => prev.map(d => d.id === editingId ? updated : d))
        setEditingId(null)
        setForm(emptyForm)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleEditFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFile(file)
    if (url) {
      setForm(p => ({ ...p, fileUrl: url }))
    }
  }

  async function uploadFile(file: File): Promise<string | null> {
    setUploading(true)
    setUploadErr('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setUploadErr(data.error ?? `Upload failed (${res.status})`)
        return null
      }
      return data.url as string
    } catch (err) {
      setUploadErr('เกิดข้อผิดพลาดในการอัพโหลด')
      console.error('Upload error:', err)
      return null
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
      const isPersonal = form.userId !== ''
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
          isPersonal,
          userId: isPersonal ? form.userId : null,
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

  function renderEditForm() {
    if (!editingId) return null
    const editCfg = typeLabels[form.type] ?? typeLabels['OTHER']!
    return (
      <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 flex items-center justify-between border-b border-indigo-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">{editCfg.emoji}</span>
            <p className="text-sm font-bold text-indigo-700">แก้ไขเอกสาร</p>
          </div>
          <button onClick={() => { setEditingId(null); setForm(emptyForm) }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="p-4 space-y-3">
          {/* Row 1: Owner + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1 block">เจ้าของ</label>
              <select value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} className={`w-full ${inputCls} !rounded-xl !py-2.5`}>
                <option value="">ทุกคน (รวม)</option>
                {members.map(m => (<option key={m.userId} value={m.userId}>{m.name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1 block">ประเภท</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={`w-full ${inputCls} !rounded-xl !py-2.5`}>
                {docTypes.map(t => (<option key={t.value} value={t.value}>{t.emoji} {t.label}</option>))}
              </select>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1 block">ชื่อเอกสาร</label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={`w-full ${inputCls} !rounded-xl !py-2.5`} placeholder="ชื่อตั๋ว / เอกสาร" />
          </div>

          {/* Row 3: EN + Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1 block">ชื่อ EN</label>
              <input type="text" value={form.titleEn} onChange={e => setForm(p => ({ ...p, titleEn: e.target.value }))} className={`w-full ${inputCls} !rounded-xl !py-2.5`} />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1 block">รายละเอียด</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={`w-full ${inputCls} !rounded-xl !py-2.5`} />
            </div>
          </div>

          {/* Row 4: File + QR */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1 block">ไฟล์แนบ</label>
              <input ref={editFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleEditFileSelect} className="hidden" />
              <div className="flex gap-2">
                <button type="button" onClick={() => editFileRef.current?.click()} disabled={uploading}
                  className="flex-1 py-2.5 border border-dashed border-gray-300 bg-gray-50 rounded-xl text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                  {uploading ? '⏳ อัพโหลด...' : form.fileUrl ? '📎 เปลี่ยนไฟล์' : '📎 เลือกไฟล์'}
                </button>
                {form.fileUrl && (
                  <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="self-center text-[10px] text-indigo-500 hover:underline font-medium">ดู</a>
                )}
              </div>
              {uploadErr && <p className="text-[10px] text-red-500 mt-1">{uploadErr}</p>}
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1 block">QR Code</label>
              <input type="text" value={form.qrData} onChange={e => setForm(p => ({ ...p, qrData: e.target.value }))} className={`w-full ${inputCls} !rounded-xl !py-2.5`} placeholder="(ถ้ามี)" />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button onClick={saveEdit} disabled={saving || !form.title.trim()}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors">
            {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
          </button>
          <button onClick={() => { setEditingId(null); setForm(emptyForm) }}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            ยกเลิก
          </button>
          <button onClick={() => { deleteDoc(editingId); setEditingId(null); setForm(emptyForm) }}
            className="px-3 py-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm transition-colors" title="ลบ">
            🗑️
          </button>
        </div>
      </div>
    )
  }

  function isPdf(url: string | null): boolean {
    return !!url && url.toLowerCase().endsWith('.pdf')
  }

  // Group docs by owner
  const groupDocs = docs.filter(d => !d.isPersonal)
  const personalDocs = docs.filter(d => d.isPersonal)

  // Group personal docs by member
  const byMember = new Map<string, DocItem[]>()
  for (const d of personalDocs) {
    const uid = d.userId ?? 'unknown'
    const arr = byMember.get(uid) ?? []
    arr.push(d)
    byMember.set(uid, arr)
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

      {/* Group documents */}
      {groupDocs.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1.5">เอกสารรวม ({groupDocs.length})</p>
          <div className="space-y-2">
            {groupDocs.map(doc => {
              if (editingId === doc.id) return <div key={doc.id}>{renderEditForm()}</div>
              const cfg = typeLabels[doc.type] ?? typeLabels['OTHER']!
              return (
                <button
                  key={doc.id}
                  onClick={() => startEdit(doc)}
                  className="w-full bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 p-3 text-left hover:border-blue-200 transition-colors"
                >
                  <span className="text-xl">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{cfg.label}</span>
                      {doc.fileUrl && <span className="text-[10px] text-blue-600">{isPdf(doc.fileUrl) ? '📄 PDF' : '📎 ไฟล์'}</span>}
                      {doc.qrData && <span className="text-[10px] text-gray-500">⬛ QR</span>}
                    </div>
                  </div>
                  <span className="text-gray-300 text-sm flex-shrink-0">✏️</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Personal documents grouped by member */}
      {personalDocs.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1.5">ตั๋วรายบุคคล ({personalDocs.length})</p>
          <div className="space-y-3">
            {Array.from(byMember.entries()).map(([uid, memberDocs]) => (
              <div key={uid} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">
                    👤 {memberMap[uid] ?? 'ไม่ทราบชื่อ'}
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {memberDocs.map(doc => {
                    if (editingId === doc.id) return <div key={doc.id} className="px-3 py-2">{renderEditForm()}</div>
                    const cfg = typeLabels[doc.type] ?? typeLabels['OTHER']!
                    return (
                      <button
                        key={doc.id}
                        onClick={() => startEdit(doc)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors"
                      >
                        <span className="text-lg">{cfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{doc.title}</p>
                          <div className="flex gap-2 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{cfg.label}</span>
                            {doc.fileUrl && <span className="text-[10px] text-blue-600">{isPdf(doc.fileUrl) ? 'PDF' : 'ไฟล์'}</span>}
                          </div>
                        </div>
                        <span className="text-gray-300 text-sm flex-shrink-0">✏️</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add document form */}
      {adding ? (
        <div className="bg-amber-50 rounded-xl p-3 space-y-2">
          {/* Member assignment */}
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">เจ้าของตั๋ว</label>
            <select
              value={form.userId}
              onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}
              className={`w-full ${inputCls}`}
            >
              <option value="">ทุกคน (เอกสารรวม)</option>
              {members.map(m => (
                <option key={m.userId} value={m.userId}>{m.name}</option>
              ))}
            </select>
          </div>

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
            {uploadErr && <p className="text-xs text-red-500 mt-1">{uploadErr}</p>}
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
