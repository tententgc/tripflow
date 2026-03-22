'use client'

import { useState, useRef } from 'react'

interface Announcement {
  id: string
  title: string
  content: string
  imageUrls: string[]
  order: number
  isPinned: boolean
  createdAt: string
}

export default function AnnouncementsManager({
  tourId,
  initialAnnouncements,
}: {
  tourId: string
  initialAnnouncements: Announcement[]
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formImageUrls, setFormImageUrls] = useState<string[]>([])
  const [formIsPinned, setFormIsPinned] = useState(false)

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400'

  function resetForm() {
    setFormTitle('')
    setFormContent('')
    setFormImageUrls([])
    setFormIsPinned(false)
    setUploadErr('')
  }

  function openAdd() {
    resetForm()
    setEditing(null)
    setAdding(true)
  }

  function openEdit(a: Announcement) {
    setFormTitle(a.title)
    setFormContent(a.content)
    setFormImageUrls([...a.imageUrls])
    setFormIsPinned(a.isPinned)
    setEditing(a)
    setAdding(true)
  }

  function closeForm() {
    setAdding(false)
    setEditing(null)
    resetForm()
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadErr('')
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file) continue
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) {
          setUploadErr(data.error ?? 'Upload failed')
          break
        }
        setFormImageUrls(prev => [...prev, data.url as string])
      }
    } catch {
      setUploadErr('Upload error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removeImage(index: number) {
    setFormImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!formTitle.trim() || !formContent.trim()) return
    setSaving(true)
    try {
      const body = {
        title: formTitle.trim(),
        content: formContent.trim(),
        imageUrls: formImageUrls,
        isPinned: formIsPinned,
      }

      if (editing) {
        const res = await fetch(`/api/tours/${tourId}/announcements/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const updated = await res.json() as Announcement
          setAnnouncements(prev => prev.map(a => a.id === editing.id ? updated : a))
        }
      } else {
        const res = await fetch(`/api/tours/${tourId}/announcements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const created = await res.json() as Announcement
          setAnnouncements(prev => [...prev, created])
        }
      }
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบประกาศนี้?')) return
    const res = await fetch(`/api/tours/${tourId}/announcements/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      if (editing?.id === id) closeForm()
    }
  }

  async function togglePin(a: Announcement) {
    const res = await fetch(`/api/tours/${tourId}/announcements/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !a.isPinned }),
    })
    if (res.ok) {
      const updated = await res.json() as Announcement
      setAnnouncements(prev => prev.map(x => x.id === a.id ? updated : x))
    }
  }

  // Sort: pinned first, then by order
  const sorted = [...announcements].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return a.order - b.order
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
            ประกาศ ({announcements.length})
          </span>
        </h2>
      </div>

      {/* Empty state */}
      {announcements.length === 0 && !adding && (
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 text-center border border-white/60">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">ยังไม่มีประกาศ</p>
          <p className="text-gray-400 text-sm mt-1">สร้างประกาศเพื่อแจ้งสมาชิกทัวร์</p>
          <button
            onClick={openAdd}
            className="mt-4 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            + สร้างประกาศ
          </button>
        </div>
      )}

      {/* Announcement list */}
      {sorted.map(a => (
        <div
          key={a.id}
          className={`bg-white/50 backdrop-blur-md rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
            a.isPinned ? 'border-amber-200/60' : 'border-white/60'
          }`}
        >
          {a.isPinned && <div className="h-0.5 bg-gradient-to-r from-amber-400 to-orange-400" />}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {a.isPinned && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      ปักหมุด
                    </span>
                  )}
                  <span className="text-sm font-bold text-gray-900 truncate">{a.title}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>

                {/* Image thumbnails */}
                {a.imageUrls.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {a.imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                      />
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-gray-400 mt-2">
                  {new Date(a.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => togglePin(a)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    a.isPinned
                      ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                      : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                  title={a.isPinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
                >
                  <svg className="w-4 h-4" fill={a.isPinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => openEdit(a)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="แก้ไข"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="ลบ"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Add/Edit form */}
      {adding && (
        <div className="bg-amber-50/80 backdrop-blur-md rounded-2xl border border-amber-200/60 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-amber-800">
            {editing ? `แก้ไขประกาศ "${editing.title}"` : 'สร้างประกาศใหม่'}
          </h3>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">หัวข้อ *</label>
            <input
              type="text"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className={inputCls}
              placeholder="เช่น จุดนัดพบเปลี่ยนแปลง"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">เนื้อหา *</label>
            <textarea
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="รายละเอียดประกาศ..."
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">รูปภาพ (ไม่จำกัดจำนวน)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full py-2.5 border border-dashed border-amber-300 bg-white rounded-xl text-sm text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition-colors font-medium"
            >
              {uploading ? 'กำลังอัพโหลด...' : 'เลือกรูปภาพ'}
            </button>
            {uploadErr && <p className="text-[10px] text-red-500 mt-1">{uploadErr}</p>}

            {formImageUrls.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {formImageUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pin toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              onClick={() => setFormIsPinned(!formIsPinned)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                formIsPinned ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
              }`}
            >
              {formIsPinned && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
            <span className="text-sm text-gray-700">ปักหมุดประกาศนี้</span>
          </label>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !formTitle.trim() || !formContent.trim()}
              className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-amber-700 transition-colors"
            >
              {saving ? 'กำลังบันทึก...' : editing ? 'บันทึก' : 'สร้างประกาศ'}
            </button>
            <button
              onClick={closeForm}
              className="px-5 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!adding && announcements.length > 0 && (
        <button
          onClick={openAdd}
          className="w-full py-2.5 bg-white/30 backdrop-blur-sm border border-dashed border-amber-200/60 text-amber-500 rounded-2xl text-sm font-medium hover:bg-white/50 hover:border-amber-300 transition-colors"
        >
          + สร้างประกาศ
        </button>
      )}
    </div>
  )
}
