'use client'

import { useState } from 'react'
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
  const [preview, setPreview] = useState(currentUrl ?? '')

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
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="font-semibold text-gray-900 text-sm mb-3">🖼️ รูปปกทัวร์</h3>

      {preview ? (
        <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-gray-100">
          <Image
            src={preview}
            alt="cover"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-full h-32 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-3">
          <span className="text-gray-400 text-sm">ยังไม่มีรูปปก</span>
        </div>
      )}

      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://images.unsplash.com/..."
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
