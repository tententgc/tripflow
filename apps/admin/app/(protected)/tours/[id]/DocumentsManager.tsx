'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

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

const typeBadgeColors: Record<string, string> = {
  FLIGHT_TICKET: 'bg-sky-100 text-sky-700', HOTEL_VOUCHER: 'bg-violet-100 text-violet-700',
  TOUR_VOUCHER: 'bg-green-100 text-green-700', VISA: 'bg-red-100 text-red-700',
  QR_CODE: 'bg-gray-200 text-gray-700', INSURANCE: 'bg-teal-100 text-teal-700',
  PASSPORT: 'bg-indigo-100 text-indigo-700', MAP: 'bg-amber-100 text-amber-700',
  VISIT_JAPAN_WEB: 'bg-rose-100 text-rose-700', CHINA_HEALTH_KIT: 'bg-red-100 text-red-700',
  OTHER: 'bg-gray-100 text-gray-600',
}

const typeLabels: Record<string, { label: string; emoji: string }> = Object.fromEntries(
  docTypes.map(t => [t.value, { label: t.label, emoji: t.emoji }])
)

type FormState = {
  title: string; titleEn: string; type: string; description: string
  qrData: string; fileUrl: string; userId: string
}

const emptyForm: FormState = {
  title: '', titleEn: '', type: 'FLIGHT_TICKET', description: '',
  qrData: '', fileUrl: '', userId: '',
}

function getCleanPath(url: string): string {
  try { return new URL(url).pathname } catch { return url.split('?')[0] ?? url }
}
function isPdf(url: string | null): boolean { return !!url && getCleanPath(url).toLowerCase().endsWith('.pdf') }
function isImage(url: string | null): boolean {
  if (!url) return false
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(getCleanPath(url))
}

/* ── Modal Form ──────────────────────────────────────── */
function DocFormModal({
  form, setForm, title, submitLabel, saving, uploading, uploadErr, members,
  onSave, onCancel, onDelete, onFileSelect, fileRef,
}: {
  form: FormState; setForm: (fn: (p: FormState) => FormState) => void
  title: string; submitLabel: string; saving: boolean; uploading: boolean; uploadErr: string
  members: MemberInfo[]; onSave: () => void; onCancel: () => void; onDelete?: (() => void) | undefined
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileRef: React.RefObject<HTMLInputElement | null>
}) {
  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400'

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-amber-50 px-5 py-3.5 border-b border-amber-100">
            <h3 className="font-semibold text-amber-800 text-sm">{title}</h3>
            <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-amber-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-h-[75vh] overflow-y-auto">
            {/* Left — Info */}
            <div className="p-5 space-y-4 border-r border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อเอกสาร *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className={inputCls} placeholder="เช่น ตั๋วเครื่องบิน TG676" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ EN</label>
                <input type="text" value={form.titleEn} onChange={e => setForm(p => ({ ...p, titleEn: e.target.value }))}
                  className={inputCls} placeholder="English title" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ประเภท</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                    {docTypes.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">เจ้าของ</label>
                  <select value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} className={inputCls}>
                    <option value="">ทุกคน (รวม)</option>
                    {members.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">รายละเอียด</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                  className={`${inputCls} resize-none`} placeholder="รายละเอียดเพิ่มเติม" />
              </div>
            </div>

            {/* Right — File/QR toggle + Preview + Actions */}
            <div className="p-5 space-y-4">
              {/* File upload */}
              <div className="bg-amber-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                  อัพโหลดไฟล์ (รูปภาพ / PDF)
                </p>
                <input ref={fileRef as React.RefObject<HTMLInputElement>} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={onFileSelect} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full py-3 border border-dashed border-amber-300 bg-white rounded-xl text-sm text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition-colors font-medium">
                  {uploading ? 'กำลังอัพโหลด...' : form.fileUrl ? '📎 เปลี่ยนไฟล์' : '📎 เลือกไฟล์'}
                </button>
                {uploadErr && <p className="text-[10px] text-red-500">{uploadErr}</p>}
                <input type="text" value={form.fileUrl} onChange={e => setForm(p => ({ ...p, fileUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-amber-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="หรือวาง URL ไฟล์" />
              </div>

              {/* Preview */}
              {form.fileUrl && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                    <p className="text-[10px] text-gray-500 font-medium">ตัวอย่างเอกสาร</p>
                    <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 font-medium hover:underline">เปิดในแท็บใหม่</a>
                  </div>
                  {isImage(form.fileUrl) ? (
                    <div className="p-2 bg-white">
                      <img src={form.fileUrl} alt="preview" className="w-full max-h-52 object-contain rounded-lg" />
                    </div>
                  ) : isPdf(form.fileUrl) ? (
                    <iframe src={form.fileUrl} className="w-full h-52 bg-white" title="PDF preview" />
                  ) : (
                    <div className="p-4 text-center bg-white">
                      <p className="text-2xl mb-1">📄</p>
                      <p className="text-xs text-gray-400 truncate">{form.fileUrl.split('/').pop()}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button onClick={onSave} disabled={saving || !form.title.trim()}
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-amber-700 transition-colors">
                  {saving ? 'กำลังบันทึก...' : submitLabel}
                </button>
                <button onClick={onCancel}
                  className="px-5 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  ยกเลิก
                </button>
                {onDelete && (
                  <button onClick={onDelete}
                    className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="ลบ">
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
export default function DocumentsManager({
  tourId, initialDocuments, members,
}: {
  tourId: string; initialDocuments: DocItem[]; members: MemberInfo[]
}) {
  const [docs, setDocs] = useState<DocItem[]>(initialDocuments)
  const [showModal, setShowModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState<DocItem | null>(null)
  const [docTab, setDocTab] = useState<'group' | 'personal'>('group')
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set())

  function toggleMember(userId: string) {
    setExpandedMembers(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function openAdd(userId: string = '') {
    setForm({ ...emptyForm, userId })
    setEditingDoc(null)
    setShowModal(true)
  }

  function openEdit(doc: DocItem) {
    setForm({
      title: doc.title, titleEn: doc.titleEn ?? '', type: doc.type,
      description: doc.description ?? '', qrData: doc.qrData ?? '',
      fileUrl: doc.fileUrl ?? '', userId: doc.userId ?? '',
    })
    setEditingDoc(doc)
    setShowModal(true)
  }

  function closeModal() { setShowModal(false); setEditingDoc(null); setForm(emptyForm) }

  async function uploadFile(file: File): Promise<string | null> {
    setUploading(true); setUploadErr('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setUploadErr(data.error ?? 'Upload failed'); return null }
      return data.url as string
    } catch { setUploadErr('เกิดข้อผิดพลาด'); return null }
    finally { setUploading(false) }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const url = await uploadFile(file)
    if (url) setForm(p => ({ ...p, fileUrl: url }))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const isPersonal = form.userId !== ''
      const body = {
        title: form.title.trim(), titleEn: form.titleEn.trim() || null,
        type: form.type, description: form.description.trim() || null,
        qrData: form.qrData.trim() || null, fileUrl: form.fileUrl.trim() || null,
        isPersonal, userId: isPersonal ? form.userId : null,
      }
      if (editingDoc) {
        const res = await fetch(`/api/tours/${tourId}/documents/${editingDoc.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (res.ok) { const u = await res.json() as DocItem; setDocs(p => p.map(d => d.id === editingDoc.id ? u : d)) }
      } else {
        const res = await fetch(`/api/tours/${tourId}/documents`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (res.ok) { const d = await res.json() as DocItem; setDocs(p => [...p, d]) }
      }
      closeModal()
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!editingDoc || !confirm('ลบเอกสารนี้?')) return
    await fetch(`/api/tours/${tourId}/documents/${editingDoc.id}`, { method: 'DELETE' })
    setDocs(p => p.filter(d => d.id !== editingDoc.id))
    closeModal()
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function deleteSelected() {
    if (!selected.size || !confirm(`ลบ ${selected.size} รายการ?`)) return
    setBulkDeleting(true)
    try {
      await Promise.all(Array.from(selected).map(id => fetch(`/api/tours/${tourId}/documents/${id}`, { method: 'DELETE' })))
      setDocs(p => p.filter(d => !selected.has(d.id))); setSelected(new Set()); setSelectMode(false)
    } finally { setBulkDeleting(false) }
  }

  const groupDocs = docs.filter(d => !d.isPersonal)
  const personalDocs = docs.filter(d => d.isPersonal)
  const byMember = new Map<string, DocItem[]>()
  for (const d of personalDocs) { const uid = d.userId ?? 'unknown'; byMember.set(uid, [...(byMember.get(uid) ?? []), d]) }
  const allMembers = members.map(m => ({ ...m, docs: byMember.get(m.userId) ?? [] }))

  function renderDocCard(doc: DocItem) {
    const cfg = typeLabels[doc.type] ?? typeLabels['OTHER']!
    return (
      <div key={doc.id}
        className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4 p-4">
          {selectMode && (
            <button onClick={() => toggleSelect(doc.id)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selected.has(doc.id) ? 'bg-red-500 border-red-500' : 'border-gray-300'
              }`}>{selected.has(doc.id) && <span className="text-white text-[10px]">✓</span>}</button>
          )}
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 text-xl">
            {cfg.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 truncate">{doc.title}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeBadgeColors[doc.type] ?? 'bg-gray-100 text-gray-600'}`}>{cfg.label}</span>
              {doc.fileUrl && <span className="text-[10px] text-blue-500">{isPdf(doc.fileUrl) ? '📄 PDF' : '📎 ไฟล์'}</span>}
              {doc.qrData && <span className="text-[10px] text-gray-400">⬛ QR</span>}
              {doc.isPersonal && doc.userId && (
                <span className="text-[10px] text-orange-500">{members.find(m => m.userId === doc.userId)?.name}</span>
              )}
            </div>
          </div>
          {!selectMode && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => openEdit(doc)}
                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="แก้ไข">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              </button>
              <button onClick={async () => { if (!confirm('ลบเอกสารนี้?')) return; await fetch(`/api/tours/${tourId}/documents/${doc.id}`, { method: 'DELETE' }); setDocs(p => p.filter(d => d.id !== doc.id)) }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="ลบ">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">เอกสาร / ตั๋ว ({docs.length})</h2>
        {docs.length > 0 && (
          <button onClick={() => { setSelectMode(v => !v); setSelected(new Set()) }}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              selectMode ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}>{selectMode ? 'ยกเลิก' : 'เลือกลบ'}</button>
        )}
      </div>

      {selectMode && selected.size > 0 && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <p className="text-sm text-red-700 font-medium">เลือกแล้ว {selected.size} รายการ</p>
          <button onClick={deleteSelected} disabled={bulkDeleting}
            className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
            {bulkDeleting ? 'กำลังลบ...' : `ลบ ${selected.size} รายการ`}
          </button>
        </div>
      )}

      {/* Sub-tabs — glass */}
      <div className="flex gap-1 p-1 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60">
        <button onClick={() => setDocTab('group')}
          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
            docTab === 'group' ? 'text-amber-700 bg-white/80 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'
          }`}>📂 เอกสารรวม ({groupDocs.length})</button>
        <button onClick={() => setDocTab('personal')}
          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
            docTab === 'personal' ? 'text-orange-700 bg-white/80 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'
          }`}>👤 รายบุคคล ({personalDocs.length})</button>
      </div>

      {/* GROUP TAB */}
      {docTab === 'group' && (
        <div className="space-y-3">
          {groupDocs.length === 0 && (
            <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 text-center border border-white/60">
              <p className="text-3xl mb-2">📂</p>
              <p className="text-gray-600 font-medium">ยังไม่มีเอกสารรวม</p>
              <button onClick={() => openAdd('')}
                className="mt-4 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors">
                + เพิ่มเอกสาร
              </button>
            </div>
          )}
          {groupDocs.map(renderDocCard)}
          {groupDocs.length > 0 && (
            <button onClick={() => openAdd('')}
              className="w-full py-3 bg-white/30 backdrop-blur-sm border border-dashed border-amber-200/60 text-amber-500 rounded-2xl text-sm font-medium hover:bg-white/50 hover:border-amber-300 transition-colors">
              + เพิ่มเอกสารรวม
            </button>
          )}
        </div>
      )}

      {/* PERSONAL TAB */}
      {docTab === 'personal' && (
        <div className="space-y-4">
          {allMembers.map(m => (
            <div key={m.userId} className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleMember(m.userId)}
                className="w-full px-4 py-2.5 bg-orange-50/80 border-b border-orange-100/60 flex items-center gap-2.5 hover:bg-orange-50 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                  {m.name[0]}
                </div>
                <p className="text-sm font-bold text-gray-800 flex-1 truncate">{m.name}</p>
                <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">{m.docs.length} ตั๋ว</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expandedMembers.has(m.userId) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {expandedMembers.has(m.userId) && m.docs.length > 0 && (
                <div className="p-3 space-y-2">
                  {m.docs.map(doc => {
                    const cfg = typeLabels[doc.type] ?? typeLabels['OTHER']!
                    return (
                      <div key={doc.id} className="flex items-center gap-3 p-2 bg-white/60 rounded-xl hover:bg-white/80 transition-colors">
                        <span className="text-lg">{cfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeBadgeColors[doc.type] ?? 'bg-gray-100 text-gray-600'}`}>{cfg.label}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(doc)} className="p-1 text-gray-400 hover:text-amber-600 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                          </button>
                          <button onClick={async () => { if (!confirm('ลบ?')) return; await fetch(`/api/tours/${tourId}/documents/${doc.id}`, { method: 'DELETE' }); setDocs(p => p.filter(d => d.id !== doc.id)) }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {expandedMembers.has(m.userId) && (
                <button onClick={() => openAdd(m.userId)}
                  className="w-full py-2 text-orange-500 text-xs font-medium hover:bg-orange-50 transition-colors border-t border-orange-50">
                  + เพิ่มตั๋วให้ {m.name}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <DocFormModal
          form={form} setForm={setForm}
          title={editingDoc ? `แก้ไข "${editingDoc.title}"` : 'เพิ่มเอกสารใหม่'}
          submitLabel={editingDoc ? 'บันทึก' : 'เพิ่มเอกสาร'}
          saving={saving} uploading={uploading} uploadErr={uploadErr} members={members}
          onSave={handleSave} onCancel={closeModal}
          onDelete={editingDoc ? handleDelete : undefined}
          onFileSelect={handleFileSelect} fileRef={fileRef}
        />
      )}
    </div>
  )
}
