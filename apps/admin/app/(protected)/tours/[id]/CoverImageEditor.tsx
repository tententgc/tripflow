'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  tourId: string
  currentUrl: string | null
}

export default function CoverImageEditor({ tourId, currentUrl }: Props) {
  const router = useRouter()
  const [url, setUrl] = useState(currentUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl ?? '')
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setUrl(data.url)
        setPreview(data.url)
      }
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/tours/${tourId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverImageUrl: url || null }),
      })
      setPreview(url)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm">
      <h3 className="font-semibold text-gray-900 text-sm mb-3">🖼️ รูปปกทัวร์</h3>

      {/* Preview */}
      {preview ? (
        <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-gray-100">
          <Image src={preview} alt="cover" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div className="w-full h-32 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-3">
          <span className="text-gray-400 text-sm">ยังไม่มีรูปปก</span>
        </div>
      )}

      {/* Upload button */}
      <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={uploadFile} className="hidden" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full py-2 mb-2 border border-dashed border-gray-300 text-gray-500 rounded-xl text-xs font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        {uploading ? 'กำลังอัพโหลด...' : '📷 อัพโหลดรูปจากเครื่อง'}
      </button>

      {/* URL input */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[10px] text-gray-400">หรือ</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <input
        type="url"
        value={url}
        onChange={(e) => { setUrl(e.target.value); setPreview(e.target.value) }}
        placeholder="วาง URL รูปภาพ (https://...)"
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
      />

      <button
        onClick={save}
        disabled={saving || url === (currentUrl ?? '')}
        className="w-full py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
      >
        {saving ? 'กำลังบันทึก...' : 'บันทึกรูปปก'}
      </button>
    </div>
  )
}
